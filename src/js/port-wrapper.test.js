import test from 'ava'
import * as constants from './constants'
import * as schema from './schema'
import portWrapper from './port-wrapper'

// TODO portWrapper does decent amount of logging -- that should be tested once
// the logger can output to memory

// TODO probably could write a macro for these tests

// This logger can be passed the test object `t`
// If `t` isn't passed, these log levels are all a noop
const createFakeLogger = (t = { log: () => {} }) => ({
  info: t.log.bind(t),
  error: t.log.bind(t),
  debug: t.log.bind(t)
})

const createFakeApp = (portName, portFunc) => ({
  ports: {
    [portName]: {
      send: portFunc
    }
  }
})

test('portWrapper -- no tag -- callback.error -- calls the callback port with null', t => {
  t.plan(2)
  const fakeData = 'fakeData'
  return portWrapper(
    createFakeLogger(t),
    'test',
    {
      func: data => {
        t.is(data, fakeData)
      },
      callback: schema.callback('test')({
        type: constants.callback.ERROR,
        tag: false
      })
    },
    createFakeApp('testFinished', data => {
      t.is(data, null)
    })
  )(fakeData)
})

test('portWrapper -- no tag -- callback.result -- calls the callback port with the result', t => {
  t.plan(2)
  const fakeData = 'fakeData'
  return portWrapper(
    createFakeLogger(t),
    'test',
    {
      func: data => {
        t.is(data, fakeData)
        return data
      },
      callback: schema.callback('test')({
        type: constants.callback.RESULT,
        tag: false
      })
    },
    createFakeApp('testFinished', data => {
      t.is(data, fakeData)
    })
  )(fakeData)
})

test('portWrapper -- default tag -- callback.result -- calls the callback port with the tag and result', t => {
  t.plan(3)
  const fakeData = 'fakeData'
  const tag = 'tag'
  return portWrapper(
    createFakeLogger(t),
    'test',
    {
      func: ([ data ]) => {
        t.is(data, fakeData)
        return data
      },
      callback: schema.callback('test')({
        type: constants.callback.RESULT
      })
    },
    createFakeApp('testFinished', ([callback, data]) => {
      t.is(data, fakeData)
      t.is(callback, tag)
    })
  )([tag, fakeData])
})

test('portWrapper -- default tag -- callback.result or error -- it calls the callback port with the tag, result and an empty error', t => {
  t.plan(4)
  const fakeData = 'fakeData'
  const tag = 'tag'
  return portWrapper(
    createFakeLogger(t),
    'test',
    {
      func: ([ data ]) => {
        t.is(data, fakeData)
        return data
      },
      callback: schema.callback('test')({
        type: constants.callback.RESULT_OR_ERROR
      })
    },
    createFakeApp('testFinished', ([callback, error, data]) => {
      t.is(data, fakeData)
      t.is(callback, tag)
      t.is(error, '')
    })
  )([tag, fakeData])
})

test('portWrapper -- default tag -- callback.result or error -- it calls the callback port with the tag, null, and a the error', t => {
  t.plan(4)
  const fakeData = 'fakeData'
  const tag = 'tag'
  return portWrapper(
    createFakeLogger(t),
    'test',
    {
      func: ([ data ]) => {
        t.is(data, fakeData)
        throw new Error('test error')
      },
      callback: schema.callback('test')({
        type: constants.callback.RESULT_OR_ERROR
      })
    },
    createFakeApp('testFinished', ([callback, error, data]) => {
      t.is(data, null)
      t.is(callback, tag)
      t.is(error.message, 'test error')
    })
  )([tag, fakeData])
})
