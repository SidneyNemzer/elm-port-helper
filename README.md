# elm-port-helper

Elm's ports allow Elm to communicate with JavaScript.

I've noticed several things about ports:

* If the JavaScript you wrote for a port throws an errors, it may crash your Elm program
* You might forget to connect a port on the JavaScript side
* Returning a result to Elm often uses one of a few similar patterns

I created elm-port-helper to fix address these.

## Quick Example

```js
import ElmPorts from 'elm-port-helper'
import Elm from 'elm/Page/Editor.elm'

const storage = firebase.storage()

const ports = ElmPorts.createPorts({
  storagePut: {
    callback: {
      type: ElmPorts.callback.ERROR,
      tag: args => ({
        tag: args[3],
        rest: args.slice(0, 3)
      }),
      name: 'storagePutFinished'
    },
    func: ([path, content, type]) => (
      storage.refFromURL(path)
        .putString(content, firebase.storage.StringFormat.RAW)
    )
  },
  storageGet: {
    callback: ElmPorts.callback.RESULT_OR_ERROR
    // TODO finish this
  }
})

const app = ElmPorts.attachPorts(ports)
```

I'd recommend defining ports in a separate file, then importing the result of
`createPorts` when initializing a page.

See more examples in the examples folder (TODO link).

## Installing

*TODO explain how to install*

## API

### `createPorts( ports )`

This function takes an object that describes the JavaScript ports and returns
an object that can be consumed by `attachPorts`.

```js
const ports = ElmPorts.createPorts({
  myFirstPort: {
    // contains a port object, Port Object below
  },
  mySecondPort: {
    // ...
  }
})
```

Technically, this function just fills in the defaults for each port if an option
isn't explicitly given.

### Port Object

This object defines a single JavaScript port, which should be passed as the value
in the object passed to `createPorts`

* `port.callback` -- Boolean or Object or one of `callback` (Default: `false`)  
  Describes what data should be returned to elm. Set to `false` to disable
  * `port.callback.type` -- One of `callback` (Default: `callback.ERROR`)  
    Defines the exact type of return. As a shortcut, you can just directly set
    `port.callback` to this, instead of the full object.
  * `port.callback.tag` -- `false` or `function` (Default: `arg[0]`)  
    This is a function that determines what to use as the callback value. The
    function should return an Object that contains the keys `tag` and `rest`. The
    tag value lets Elm track which operation just completed, and usually isn't
    used in the JavaScript side of the port. The tag is always passed as the first
    value in the result array.
  * `port.callback.name` -- String (Default: port's name + `'Finished'`)
    The name of the Elm port to send the result to. Defaults to this port's name
    plus `Finished`.
* `port.func` -- `function`  
  The actual port function. This is the JavaScript that will run when Elm calls
  the port. If it returns a Promise, elm-port-helper will wait for the Promise
  to resolve. The result of the Promise, or any plain value, will be wrapped in
  an array with the callback tag as the first value. If the callback tag is
  disabled, the result is *not* wrapped in an array.

Example:
```js
ElmPorts.createPorts({
  examplePort: {
    callback: {
      type: ElmPorts.callback.RESULT,
      // `tag` defaults to the first arg of the array, so here we need to
      // explicitly retrieve it from the end of the args.
      tag: args => ({
        tag: args[3],
        rest: args.slice(0, 3)
      }),
      // The port used to send the result to Elm
      name: 'examplePortComplete'
    },
    func: ([val0, val1, val2]) => {
      // This isn't a very useful port, but hopefully you get the idea
      return val0.indexOf(val1) + val2
    }
  }
})
```

### `callback`

This built-in object provides the possible values for a port's callback option.

* `callback.RESULT_OR_ERROR`  
  Errors turn into `[tag, error, null]`. A successful result turns into
  `[tag, '', result]` (empty string in place of an error).
* `callback.ERROR`  
  Errors turn into `[tag, error]`. Non-errors turn into `[tag, null]`.
* `callback.RESULT`  
  Result turns into `[tag, result]`. Errors are not sent to Elm.
* `callback.NONE`  
  Nothing is returned to Elm. This is the same as setting `port.callback` to
  `false`.


### `attachPorts( ports, options )`

The `ports` argument should be the result of calling `createPorts()`

The `options` is an Object with the following keys:

* `options.listenToEmptyPorts` -- Boolean (Default: `true`)  
  Attaches a listener to ports that the Elm app exposes if you don't explicitly
  define a JavaScript handler for that port. This will print a console warning
  if Elm sends any data over those ports. This acts as a reminder if you forget
  to handle a port on the JavaScript side.
* `options.warnOnIgnoredReturns` -- Boolean (Default: `true`)  
  If the JavaScript function for a port returns a value but its `callback` is set
  to `false`, this settings will print a warning in the console to let you know
  that you might have forgotten to set up a callback for the return.
* `options.logging` -- Boolean (Default: `logging.ERRORS`)  
  This sets what type of messages will be printed in the JavaScript console. See
  the built-in `logging` object below.

Example:
```js
ElmPorts.attachPorts(ports, {
  listenToEmptyPorts: false,
  warnOnIgnoredReturns: true,
  logging: ElmPorts.logging.DEBUG
})
```

### `logging`

This built-in object provides the possible options for `attachPorts`'s logging option

* `logging.NONE`  
  Don't print any messages at all
* `logging.ERRORS`  
  Only print a message when a port errors
* `logging.RESULT`  
  Print whatever the result of a port is (including errors)
* `logging.DEBUG`  
  Prints errors and results, and some additional

Example:
```js
ElmPorts.attachPorts(ports, {
  logging: ElmPorts.logging.DEBUG
})
```
