import { callback } from './constants'
import * as defaults from './defaults'

export const expandCallbackObject = (logger, portName, portDefinitionCallback) => {
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
        ? defaults.tagFunction
        : portDefinitionCallback.tag,
      name: portDefinitionCallback.name || portName + 'Finished'
    }
  } else if (typeof portDefinitionCallback === 'boolean') {
    expandedCallback = portDefinitionCallback
      ? {
        type: callback.ERROR,
        tag: defaults.tagFunction,
        name: portName + 'Finished'
      }
      : false
  } else if (typeof portDefinitionCallback === 'string') {
    // Assume the callback has been set to one of the callback constants
    expandedCallback = {
      type: portDefinitionCallback,
      tag: defaults.tagFunction,
      name: portName + 'Finished'
    }
  }
  logger.debug(`Expanded callback for port ${portName} from`, portDefinitionCallback, 'to', expandedCallback)
  return expandedCallback
}
