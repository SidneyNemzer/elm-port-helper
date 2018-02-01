import * as detect from './detect'

const portHandler = (name, logger) => data => {
  const splitArgs =
    expandedCallback
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

}

const portWrapper = (name, portDefinition, elmPort) => {
  const func =
    typeof portDefinition === 'function'
      ? portDefinition
      : typeof portDefinition === 'object' && typeof portDefinition.func === 'function'
        ? portDefinition.func
        : null

  const expandedCallback =
    typeof portDefinition === 'object'
      ? expandCallbackObject(logger, name, portDefinition.callback)
      : false

  if (typeof func !== 'function') {
    throw new TypeError(`Port ${name} does not have a valid port function defintion`)
  }

  elmPort.subscribe(portHandler())
}
