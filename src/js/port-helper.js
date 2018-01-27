import * as R from 'ramda'
import createLogger from './logger'
import { checkArgType } from './util'
import { callback, logging } from './constants'
import * as detect from './detect'
import * as defaults from './defaults'
import { expandCallbackObject } from './schema'

const attachPorts = (ports, options, app) => {
  // Check arguments
  checkArgType('object', ports, 'ports', 1)
  if (detect.looksLikeOptions(options)) {
    if (app === undefined) {
      // Looks like app was not given
      throw new TypeError('Third argument "app" should be an Elm app instance, but it\'s undefined.')
    }
  } else if (options !== undefined && detect.looksLikeApp(options)) {
    // app was passed as the second argument, fix argument order
    app = options
    options = {}
  }

  options.listenToEmptyPorts = typeof options.listenToEmptyPorts === 'boolean' ? options.listenToEmptyPorts : true
  options.warnOnIgnoredReturns = typeof options.warnOnIgnoredReturns === 'boolean' ? options.warnOnIgnoredReturns : true

  // Create logger
  const logger = createLogger('elm-port-helper', options.logging || logging.ERRORS)

  if (options.logging >= logging.DEBUG) {
    console.warn('[elm-port-helper] Debug logging is enabled. There will be a lot of messages. You might want disable this in production.')
  }

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
      const splitArgs
        = expandedCallback
          ? typeof expandedCallback.tag === 'function'
            ? expandedCallback.tag(data)
            : false
          : false

      if (splitArgs) {
        logger.debug(`Port ${name} has been called by elm with`, {
          tag: splitArgs.tag,
          data: splitArgs.rest
        })
      } else {
        logger.debug(`Port ${name} has been called by Elm with`, data)
      }

      let portResult
      try {
        portResult = func(splitArgs ? splitArgs.rest : data)
        portResult = detect.looksLikePromise(portResult)
          ? (logger.debug(`Resolving promise result from port ${name}...`), portResult)
          : Promise.resolve(portResult)
      } catch (error) {
        portResult = Promise.reject(error)
      }

      portResult
        .then(result => {
          if (expandedCallback) {
            logger.info(`Port ${name} returned a value to Elm:`, result)
            switch (expandedCallback.type) {
              case callback.RESULT_OR_ERROR:
                if (splitArgs) {
                  app.ports[expandedCallback.name].send([splitArgs.tag, '', result])
                } else {
                  app.ports[expandedCallback.name].send(['', result])
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
                  app.ports[expandedCallback.name].send([splitArgs.tag, result])
                } else {
                  app.ports[expandedCallback.name].send(result)
                }
                break
              default:
                throw new Error(`Port ${name} has an unexpected callback.type: ${expandedCallback.type}`)
            }
          } else {
            if (result !== undefined) {
              if (options.warnOnIgnoredReturns) {
                const callbackSetting = expandedCallback && expandedCallback.type
                console.warn(
                  `Port ${name} returned a non-undefined value:`,
                  result,
                  `\nThe value was not returned to Elm because the port's callback is set to ${callbackSetting}`
                )
              } else {
                logger.debug(`Port ${name} finished successfully with a non-undefined result (warning suppressed because options.warnOnIgnoredReturns = ${options.warnOnIgnoredReturns})`)
              }
            } else {
              logger.debug(`Port ${name} finished successfully with no result`)
            }
          }
        }, portError => {
          if (expandedCallback) {
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
            logger.error(`Port ${name} errored when running (not sent to Elm):`, portError)
            logger.debug(`Error result from ${name} was not returned to Elm because the port's callback is set to ${portDefinition.callback}`)
          }
        })
    })
  }

  // Begin attaching ports
  // TODO we'll never get here if app.ports isn't an Objet, since we detect
  // app based on the existance of ports
  if (typeof app.ports !== 'object' || Object.keys(app.ports).length === 0) {
    throw new Error('This Elm app has no ports')
  }
  logger.debug('Started attaching ports')
  const attachedPorts = Object.keys(app.ports)
    .reduce((attachedPorts, portName) => {
      logger.debug(`Inspecting port ${portName}`)
      const port = app.ports[portName]
      if (detect.isInputPort(port)) {
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
          port.subscribe(defaults.emptyPortListener)
        } else {
          logger.debug(`No listener was attached to port ${portName} because there isn't a user defined listener and options.listenToEmptyPorts isn't enabled`)
        }
      }
      return attachedPorts
    }, [])

  const portCounts = Object.keys(app.ports)
    .reduce(
      (ports, portName) =>
        R.over(
          detect.isInputPort(app.ports[portName]) ? R.lensProp('input') : R.lensProp('output'),
          R.inc,
          ports
        ),
      { input: 0, output: 0 }
    )

  logger.debug(`Elm app has ${portCounts.input} input port(s) and ${portCounts.output} output port(s)`)
  logger.debug(`Attached ${attachedPorts.length} out of ${Object.keys(ports).length} user defined port(s)`)
  return app
}

export default {
  callback,
  logging,
  attachPorts
}
