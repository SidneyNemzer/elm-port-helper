import test from 'ava'
import * as schema from './schema'

test('isType correctly checks types', t => {
  const { isType } = schema.TESTING_USE_ONLY
  t.true(isType(Function, function () {}))
  t.true(isType(Function, () => {}))
  t.false(isType(Object, ''))
})

const checkSchemaKeyMacro = (t, keyName, keySchema, value, expectedOutput) => {
  const { checkSchemaKey } = schema.TESTING_USE_ONLY
  t.is(checkSchemaKey(keyName, keySchema, value), expectedOutput)
}
checkSchemaKeyMacro.title = providedTitle => `checkSchemaKey ${providedTitle}`

const checkSchemaKeyErrorMacro = (t, keyName, keySchema, value, expectedErrorMessage) => {
  const { checkSchemaKey } = schema.TESTING_USE_ONLY
  const error = t.throws(() => checkSchemaKey(keyName, keySchema, value))
  t.is(error.message, expectedErrorMessage)
}

test('isType correctly checks types', t => {
  const { checkSchemaKey } = schema.TESTING_USE_ONLY
  t.is(
    checkSchemaKey('testKey', {
      type: String,
      required: true
    }, 'testValue'),
    'testValue'
  )
  const error1 = t.throws(() =>
    checkSchemaKey('testKey', {
      type: String,
      required: true
    }, undefined)
  )
  t.is(error1.message, 'testKey is required but wasn\'t given')
  t.is(
    checkSchemaKey('testKey', {
      type: String,
      default: 'defaultValue'
    }, undefined),
    'defaultValue'
  )
  const error2 = t.throws(() =>
    checkSchemaKey('testKey', {
      type: String,
      enum: ['a', 'b', 'c']
    }, 'd')
  )
  t.is(error2.message, 'testKey must be one of ["a","b","c"] but it\'s "d"')
  t.is(
    checkSchemaKey('testKey', {
      type: String,
      enum: ['a', 'b']
    }, 'a'),
    'a'
  )
  t.is(
    checkSchemaKey('testKey', {
      type: String,
      test: val => val.includes('includes-this')
    }, 'it-includes-this'),
    'it-includes-this'
  )
  const error3 = t.throws(() =>
    checkSchemaKey('testKey', {
      type: String,
      test: val => val.includes('not-this') || `it's missing "not-this"!`
    }, 'it-includes-this')
  )
  t.is(error3.message, 'testKey\'s value "it-includes-this" failed the schema test: it\'s missing "not-this"!')
})
