import createLogger from './logger'
import { checkArgType } from './util'
import { callback, logging } from './constants'
import * as detect from './detect'
import * as defaults from './defaults'
import * as schema from './schema'
import portWrapper from './port-wrapper'

const attachPorts = (ports, options, app) => {
  // Verify arguments
  checkArgType('object', ports, 'ports', 1)
  if (options !== undefined && detect.looksLikeApp(options)) {
    // app was passed as the second argument, fix argument order
    app = options
    options = {}
  }

  if (app === undefined || !detect.looksLikeApp(app)) {
    // Looks like app was not given
    throw new TypeError('Third argument "app" should be an Elm app instance, but it\'s ' + typeof app)
  }

  if (Object.keys(app.ports).length === 0) {
    throw new Error('The given Elm app has no ports')
  }

  options.listenToEmptyPorts = typeof options.listenToEmptyPorts === 'boolean' ? options.listenToEmptyPorts : true
  options.warnOnIgnoredReturns = typeof options.warnOnIgnoredReturns === 'boolean' ? options.warnOnIgnoredReturns : true

  // Create logger
  const logger = createLogger('elm-port-helper', options.logging || logging.ERRORS)

  if (options.logging >= logging.DEBUG) {
    console.warn('[elm-port-helper] Debug logging is enabled. There will be a lot of messages. You might want disable this in production.')
  }

  // Begin attaching ports
  logger.debug('Started attaching ports')
  const attachedPorts = Object.keys(app.ports)
    .reduce((attachedPorts, portName) => {
      logger.debug(`Inspecting port ${portName}`)
      const elmPort = app.ports[portName]
      const portDefinition = ports[portName]

      if (portDefinition) {
        if (detect.isInputPort(elmPort)) {
          throw new TypeError(`Cannot subscribe to port ${portName} because it's an input port`)
        }
        const expandedDefinition = schema.port(portName, portDefinition)
        logger.debug(`Expended options for port ${portName} to`, expandedDefinition)
        elmPort.subscribe(portWrapper(
          logger,
          portName,
          expandedDefinition,
          app,
          options.warnOnIgnoredReturns
        ))
        attachedPorts.push(portName)
        logger.debug(`Added user-defined handler to port ${portName}`)
      } else if (options.listenToEmptyPorts) {
        elmPort.subscribe(defaults.emptyPortListener(portName))
        logger.debug(`User has not defined a handler for port ${portName}, added 'empty' listener`)
      } else {
        logger.debug(`No listener was attached to port ${portName} because there isn't a user defined listener and options.listenToEmptyPorts isn't enabled`)
      }
      return attachedPorts
    }, [])

  const portCounts = detect.countAppPorts(app)

  logger.debug(`Elm app has ${portCounts.input} input port(s) and ${portCounts.output} output port(s)`)
  logger.debug(`Attached ${attachedPorts.length} out of ${Object.keys(ports).length} user defined port(s)`)
  return app
}

export default {
  callback,
  logging,
  attachPorts
}
