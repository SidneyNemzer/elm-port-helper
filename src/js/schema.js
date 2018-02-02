import * as R from 'ramda'
import { callback } from './constants'
import * as defaults from './defaults'

const isType = (expected, value) => (
  typeof value === expected.name.toLowerCase()
)

const checkSchemaKey = (key, keySchema, value) => {
  if (value === undefined) {
    if (!keySchema.hasOwnProperty('default')) {
      throw new TypeError(`${key} is required but wasn't given`)
    }
    return keySchema.default
  }
  if (keySchema.type && !isType(keySchema.type, value)) {
    throw new TypeError(`${key} must be the type ${keySchema.type.name.toLowerCase()} but it's ${typeof value}`)
  }
  if (keySchema.enum && !keySchema.enum.includes(value)) {
    throw new Error(`${key} must be one of ${JSON.stringify(keySchema.enum)} but it's ${JSON.stringify(value)}`)
  }
  if (isType(Function, keySchema.test)) {
    const testResult = keySchema.test(value)
    if (isType(String, testResult)) {
      throw new Error(`${key}'s value ${JSON.stringify(value)} failed the schema test: ${testResult}`)
    }
  }
  return value
}

export const createSchema = schemaDescription => value => {
  if (!isType(Object, value)) {
    if (isType(String, schemaDescription.root)) {
      value = { [schemaDescription.root]: value }
    } else {
      throw new TypeError('Expected object but got ' + typeof value)
    }
  }
  return R.mapObjIndexed(
    (keySchema, key) => checkSchemaKey(key, keySchema, value[key]),
    schemaDescription.keys
  )
}

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

// Export some additional functions for testing
export const TESTING_USE_ONLY = {
  isType,
  checkSchemaKey
}
