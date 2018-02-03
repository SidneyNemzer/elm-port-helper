import * as R from 'ramda'
import * as constants from './constants'
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

export const callback = portName =>
  createSchema({
    root: 'type',
    keys: {
      type: {
        enum: R.values(constants.callback),
        default: constants.callback.ERROR
      },
      tag: {
        type: Function,
        default: defaults.tagFunction,
        test: fn => {
          const result = fn([1, 2, 3])
          return (
            (R.has('tag', result) && R.has('rest', result))
              || 'The callback.tag function must return an object with "tag" and "result"'
          )
        }
      },
      name: {
        type: String,
        default: portName + 'Finished'
      }
    }
  })

const portNoCallback =
  createSchema({
    root: 'func',
    keys: {
      func: {
        type: Function,
        required: true
      },
      callback: {
        default: false
      }
    }
  })

// Second argument is intentional, I don't want to curry or use partial application
// with this function
export const port = (portName, portDescription) =>
  R.pipe(
    portNoCallback,
    R.over(R.lensProp('callback'), callback(portName))
  )(portDescription)

// Export some additional functions for testing
export const TESTING_USE_ONLY = {
  isType,
  checkSchemaKey,
  portNoCallback
}
