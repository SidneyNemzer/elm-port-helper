import * as R from 'ramda'
import createLogger from './logger'
import { checkArgType } from './util'

/* Define constants */

const callback = {
  NONE: false,
  RESULT: 'RESULT',
  ERROR: 'ERROR',
  RESULT_OR_ERROR: 'RESULT_OR_ERROR'
}

const logging = {
  NONE: 0,
  ERRORS: 1,
  RESULT: 2,
  DEBUG: 3
}

/* Define a few helper functions */

const looksLikeOptions = maybeOptions =>
  R.has('listenToEmptyPorts', maybeOptions)
  || R.has('warnOnIgnoredReturns', maybeOptions)
  || R.has('logging', maybeOptions)

const looksLikeApp = maybeApp =>
  R.has('ports', maybeApp)

const isInputPort = port =>
  R.has('send', port)

const emptyPortListener = name => data =>
  console.warn(`The empty port "${name}" sent data to JavaScript:`, data)

const defaultTagFunction = args => ({
  tag: args[0],
  rest: args.slice(1)
})

const expandCallbackObject = (logger, portName, portDefinitionCallback) => {
  let expandedCallback = false
  if (typeof portDefinitionCallback === 'object') {
    if (
      portDefinitionCallback.tag !== undefined
      && typeof portDefinitionCallback.tag !== 'function'
      && typeof portDefinitionCallback.tag !== 'boolean'
    ) {
      throw new TypeError(`Port ${portName}.callback.tag should be a function but it's ${typeof portDefinitionCallback.tag}`)
    }

    if (
      portDefinitionCallback.name !== undefined
      && typeof portDefinitionCallback.name !== 'string'
    ) {
      throw new TypeError(`Port ${portName}.callback.name should be a string but it's ${typeof portDefinitionCallback.name}`)
    }

    expandedCallback = {
      type: portDefinitionCallback.type || callback.ERROR,
      tag: portDefinitionCallback.tag === undefined
        ? defaultTagFunction
        : portDefinitionCallback.tag,
      name: portDefinitionCallback.name || portName + 'Finished'
    }
  } else if (typeof portDefinitionCallback === 'boolean') {
    expandedCallback = portDefinitionCallback
      ? {
        type: callback.ERROR,
        tag: defaultTagFunction,
        name: portName + 'Finished'
      }
      : false
  } else if (typeof portDefinitionCallback === 'string') {
    // Assume the callback has been set to one of the callback constants
    expandedCallback = {
      type: portDefinitionCallback,
      tag: defaultTagFunction,
      name: portName + 'Finished'
    }
  }
  logger.debug(`Expanded callback for port ${portName} from`, portDefinitionCallback, 'to', expandedCallback)
  return expandedCallback
}

/* Main attachPort function */

const attachPorts = (ports, options, app) => {
  // Check arguments
  checkArgType('object', ports, 'ports', 1)
  if (looksLikeOptions(options)) {
    if (app === undefined) {
      // Looks like app was not given
      throw new TypeError('Third argument "app" should be an Elm app instance, but it\'s undefined.')
    }
  } else if (options !== undefined && looksLikeApp(options)) {
    // app was passed as the second argument, fix argument order
    app = options
    options = {}
  }

  options.listenToEmptyPorts = typeof options.listenToEmptyPorts === 'boolean' ? options.listenToEmptyPorts : true
  options.warnOnIgnoredReturns = typeof options.warnOnIgnoredReturns === 'boolean' ? options.warnOnIgnoredReturns : true

  // Create logger
  const logger = createLogger(options.logging || logging.ERRORS)

  const portWrapper = (name, portDefinition, elmPort) => {
    const func
      = typeof portDefinition === 'function'
        ? portDefinition
        : typeof portDefinition === 'object' && typeof portDefinition.func === 'function'
          ? portDefinition.func
          : null

    const expandedCallback
      = typeof portDefinition === 'object'
        ? expandCallbackObject(logger, name, portDefinition.callback)
        : false

    if (typeof func !== 'function') {
      throw new TypeError(`Port ${name} does not have a valid port function defintion`)
    }

    elmPort.subscribe(data => {
      logger.debug(`Port ${name} has been called by Elm with`, data)
      const splitArgs
        = expandedCallback
          ? typeof expandedCallback.tag === 'function'
            ? expandedCallback.tag(data)
            : false
          : false

      // TODO Resolve promises that are returned from func
      let portResult
      let portError = null
      try {
        portResult = func(splitArgs ? splitArgs.rest : data)
      } catch (error) {
        portError = error
      }

      if (expandedCallback) {
        if (portError) {
          logger.error(`Port ${name} errored when running (sending to Elm):`, portError)
          switch (expandedCallback.type) {
            case callback.RESULT_OR_ERROR:
              if (splitArgs) {
                app.ports[expandedCallback.name].send([splitArgs.tag, portError, null])
              } else {
                app.ports[expandedCallback.name].send([portError, null])
              }
              break
            case callback.ERROR:
              if (splitArgs) {
                app.ports[expandedCallback.name].send([splitArgs.tag, portError])
              } else {
                app.ports[expandedCallback.name].send(portError)
              }
              break
            case callback.RESULT:
              // Do nothing
              break
            default:
              throw new Error(`Port ${name} has an unexpected callback.type: ${expandedCallback.type}`)
          }
        } else {
          logger.info(`Port ${name} returned (sending to Elm):`, portResult)
          switch (expandedCallback.type) {
            case callback.RESULT_OR_ERROR:
              if (splitArgs) {
                app.ports[expandedCallback.name].send([splitArgs.tag, '', portResult])
              } else {
                app.ports[expandedCallback.name].send(['', portResult])
              }
              break
            case callback.ERROR:
              if (splitArgs) {
                app.ports[expandedCallback.name].send([splitArgs.tag, null])
              } else {
                app.ports[expandedCallback.name].send(null)
              }
              break
            case callback.RESULT:
              if (splitArgs) {
                app.ports[expandedCallback.name].send([splitArgs.tag, portResult])
              } else {
                app.ports[expandedCallback.name].send(portResult)
              }
              break
            default:
              throw new Error(`Port ${name} has an unexpected callback.type: ${expandedCallback.type}`)
          }
        }
      } else {
        if (portError) {
          logger.error(`Port ${name} errored when running (not sent to Elm):`, portError)
          logger.debug(`Error result from ${name} was not returned to Elm because the port's callback is set to ${portDefinition.callback}`)
        } else if (options.warnOnIgnoredReturns && portResult) {
          const callbackSetting = expandedCallback && expandedCallback.type
          console.warn(
            `Port ${name} returned a non-undefined value:`,
            portResult,
            `\nThe value was not returned to Elm because the port's callback is set to ${callbackSetting}`)
        } else {
          logger.debug(`Port ${name} finished successfully with no result`)
        }
      }
    })
  }

  // Begin attaching ports
  if (typeof app.ports !== 'object' || Object.keys(app.ports).length === 0) {
    throw new Error('This Elm app has no ports')
  }
  logger.debug('Started attaching ports')
  const attachedPorts = Object.keys(app.ports)
    .reduce((attachedPorts, portName) => {
      logger.debug(`Inspecting port ${portName}`)
      const port = app.ports[portName]
      if (isInputPort(port)) {
        if (ports[portName]) {
          // This port only has a `send` function to send data to Elm. It can't
          // be subscribed to. Show an error but continue running.
          logger.error(`Cannot attach to port ${portName} because it's an input port`)
        }
      } else {
        if (ports[portName]) {
          logger.debug(`Adding user-defined handler to port ${portName}`)
          portWrapper(portName, ports[portName], port)
          attachedPorts.push(portName)
        } else if (options.listenToEmptyPorts) {
          logger.debug(`User has not defined a handler for port ${portName}, adding 'empty' listener`)
          port.subscribe(emptyPortListener)
        } else {
          logger.debug(`No listener was attached to port ${portName} because there isn't a user defined listener and options.listenToEmptyPorts isn't enabled`)
        }
      }
      return attachedPorts
    }, [])

  logger.debug(`Attached ${attachedPorts.length} out of ${Object.keys(ports).length} user defined ports`)
  return app
}

/* Export public stuff */

export default {
  callback,
  logging,
  attachPorts
}