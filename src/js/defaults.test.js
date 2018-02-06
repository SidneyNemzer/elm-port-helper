import test from 'ava'
import * as defaults from './defaults'

test('tagFunction uses the first element as the tag', t => {
  t.deepEqual(
    defaults.tagFunction([1, 2, 3]),
    {
      tag: 1,
      rest: [2, 3]
    }
  )
})
