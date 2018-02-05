import * as constants from './constants'

const portWrapper = (logger, name, { func, callback }, app, warnOnIgnoredReturns) => data => {
  const splitArgs = callback.type && callback.tag && callback.tag(data)

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
    portResult = Promise.resolve(
      func(splitArgs ? splitArgs.rest : data)
    )
  } catch (error) {
    portResult = Promise.reject(error)
  }

  return portResult
    .then(result => {
      if (callback.type) {
        logger.info(`Port ${name} returned a value to Elm:`, result)
        if (splitArgs) {
          switch (callback.type) {
            case constants.callback.RESULT_OR_ERROR:
              app.ports[callback.name].send([splitArgs.tag, '', result])
              break
            case constants.callback.ERROR:
              app.ports[callback.name].send([splitArgs.tag, null])
              break
            case constants.callback.RESULT:
              app.ports[callback.name].send([splitArgs.tag, result])
              break
            default:
              throw new Error(`Port ${name} has an unexpected callback.type: ${callback.type}`)
          }
        } else {
          switch (callback.type) {
            case constants.callback.RESULT_OR_ERROR:
              app.ports[callback.name].send(['', result])
              break
            case constants.callback.ERROR:
              app.ports[callback.name].send(null)
              break
            case constants.callback.RESULT:
              app.ports[callback.name].send(result)
              break
            default:
              throw new Error(`Port ${name} has an unexpected callback.type: ${callback.type}`)
          }
        }
      } else {
        if (result !== undefined) {
          if (warnOnIgnoredReturns) {
            const callbackSetting = callback.type
            console.warn(
              `Port ${name} returned a non-undefined value:`,
              result,
              `\nThe value was not returned to Elm because the port's callback is set to ${callbackSetting}`
            )
          } else {
            logger.debug(`Port ${name} finished successfully with a non-undefined result (warning suppressed because options.warnOnIgnoredReturns = ${warnOnIgnoredReturns})`)
          }
        } else {
          logger.debug(`Port ${name} finished successfully with no result`)
        }
      }
    }, portError => {
      if (callback) {
        logger.error(`Port ${name} errored when running (sending to Elm):`, portError)
        switch (callback.type) {
          case constants.callback.RESULT_OR_ERROR:
            if (splitArgs) {
              app.ports[callback.name].send([splitArgs.tag, portError, null])
            } else {
              app.ports[callback.name].send([portError, null])
            }
            break
          case constants.callback.ERROR:
            if (splitArgs) {
              app.ports[callback.name].send([splitArgs.tag, portError])
            } else {
              app.ports[callback.name].send(portError)
            }
            break
          case constants.callback.RESULT:
            // Do nothing
            break
          default:
            throw new Error(`Port ${name} has an unexpected callback.type: ${callback.type}`)
        }
      } else {
        logger.error(`Port ${name} errored when running (not sent to Elm):`, portError)
        logger.debug(`Error result from ${name} was not returned to Elm because the port's callback is set to ${callback}`)
      }
    })
}

export default portWrapper
