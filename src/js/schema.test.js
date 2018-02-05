import test from 'ava'
import * as constants from './constants'
import * as schema from './schema'

/* isType */

test('isType correctly checks types', t => {
  const { isType } = schema.TESTING_USE_ONLY
  t.true(isType(Function, function () {}))
  t.true(isType(Function, () => {}))
  t.false(isType(Object, ''))
})

/* checkSchemaKey */

const checkSchemaKeyMacro = (t, keySchema, value, expectedOutput) => {
  const { checkSchemaKey } = schema.TESTING_USE_ONLY
  t.is(checkSchemaKey('testKey', keySchema, value), expectedOutput)
}
checkSchemaKeyMacro.title = providedTitle => `checkSchemaKey ${providedTitle}`

const checkSchemaKeyErrorMacro = (t, keySchema, value, expectedErrorMessage) => {
  const { checkSchemaKey } = schema.TESTING_USE_ONLY
  const error = t.throws(() => checkSchemaKey('testKey', keySchema, value))
  t.is(error.message, expectedErrorMessage)
}
checkSchemaKeyErrorMacro.title = providedTitle => `checkSchemaKey errors ${providedTitle}`

test(
  'returns a the value when it passes the schema',
  checkSchemaKeyMacro,
  { type: String },
  'testValue',
  'testValue'
)

test(
  "when a required value isn't given",
  checkSchemaKeyErrorMacro,
  { type: String, required: true },
  undefined,
  "testKey is required but wasn't given"
)

test(
  'returns the default when no value is given',
  checkSchemaKeyMacro,
  { default: 'defaultValue' },
  undefined,
  'defaultValue'
)

test(
  'when the value is not in the enum',
  checkSchemaKeyErrorMacro,
  { enum: ['a', 'b', 'c'] },
  'd',
  `testKey must be one of ["a","b","c"] but it's "d"`
)

test(
  'returns the value when it is in the enum',
  checkSchemaKeyMacro,
  { enum: ['a', 'b'] },
  'b',
  'b'
)

test(
  'returns the value when it passes the test function',
  checkSchemaKeyMacro,
  { test: val => val.includes('includes-this') && val },
  'it-includes-this',
  'it-includes-this'
)

test(
  'allows the test function to alter the value',
  checkSchemaKeyMacro,
  { test: val => val === 'change me' ? 'to this' : val },
  'change me',
  'to this'
)

test(
  'when the value does not pass the test function',
  checkSchemaKeyErrorMacro,
  {
    test: val => {
      if (val.includes('not-this')) {
        return val
      } else {
        throw new Error('failed test')
      }
    }
  },
  'it-includes-this',
  `testKey's value "it-includes-this" failed the schema test: failed test`
)

/* createSchema */

test('createSchema uses the root when a non-object value is given', t => {
  t.deepEqual(
    schema.createSchema({
      root: 'testRoot',
      keys: { testRoot: { type: String } }
    })('just-a-string'),
    { testRoot: 'just-a-string' }
  )
})

test('createSchema errors when given a non-object without a root', t => {
  const error = t.throws(() =>
    schema.createSchema({
      keys: { test: { type: String } }
    })('just-a-string')
  )
  t.is(error.message, 'Expected object but got string')
})

test('createSchema inserts defaults when their value is not given', t => {
  t.deepEqual(
    schema.createSchema({
      keys: {
        testKey1: { default: 'default1' },
        testKey2: { default: 'default2' },
        testKey3: { type: String }
      }
    })({ testKey3: 'testValue' }),
    {
      testKey1: 'default1',
      testKey2: 'default2',
      testKey3: 'testValue'
    }
  )
})

/* callback */

test('callback correctly expands the given value', t => {
  const result = schema.callback('test')(false)
  t.false(result.type)
  t.is(typeof result.tag, 'function')
  t.is(result.name, 'testFinished')
})

test('callback does not modify values when they are valid', t => {
  const tagFn = () => ({ tag: true, rest: true })
  const result = schema.callback('test')({
    type: constants.callback.RESULT,
    tag: tagFn,
    name: 'testName'
  })
  t.deepEqual(result, {
    type: constants.callback.RESULT,
    tag: tagFn,
    name: 'testName'
  })
})

/* port */

test('portNoCallback correctly extands a function to an object', t => {
  const { portNoCallback } = schema.TESTING_USE_ONLY
  const result = portNoCallback(() => {})
  t.false(result.callback)
  t.is(typeof result.func, 'function')
})

test('port correctly extands a function to an object', t => {
  const result = schema.port('test', () => {})
  t.is(typeof result.callback, 'object')
  t.is(typeof result.func, 'function')
})

test('port does not modify values when they are valid', t => {
  const tagFn = () => ({ tag: true, rest: true })
  const result = schema.port('test', {
    // You'd never use the tagFn like this, but it saves us having to create another fake function
    func: tagFn,
    callback: {
      tag: tagFn
    }
  })
  t.is(result.func, tagFn)
  t.is(result.callback.tag, tagFn)
  t.is(result.callback.type, constants.callback.ERROR)
})
