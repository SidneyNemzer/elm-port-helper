# elm-port-helper

[Elm](http://elm-lang.org/)'s ports allow Elm to communicate with JavaScript.

I've noticed several things about ports:

* If the JavaScript you wrote for a port throws an errors, it may crash your Elm program
* You might forget to connect a port on the JavaScript side
* Returning a result to Elm often uses one of a few similar patterns

I created elm-port-helper to make the JavaScript side of ports less tedious.

## Quick Example

```js
import ElmPorts from 'elm-port-helper'
import Elm from './Main.elm'

const app = Elm.Main.fullscreen()

ElmPorts.attachPorts({
  // These first two ports are called by Elm and preform some side effect.
  // They don't return data to Elm
  setTitle: title => {
    window.title = title
  },
  storageSet: ([path, value]) => {
      window.localStorage[path] = value
    }
  },

  // This port is called by Elm then returns some data
  storageGet: {
    // The callback.RESULT constant tells elm-port-helper to expect some result
    // from the func and give it to Elm. Since a callback port name is not
    // specified, this port's name plus "Finished" will be used (storageGetFinished)
    callback: ElmPorts.callback.RESULT,
    func: ([path]) => (
      window.localStorage.getItem(path) || ''
    )
  }
}, {
  logging: ElmPorts.logging.DEBUG
}, app)

```

I'd recommend defining ports in a separate file, then importing the object of
ports in each JavaScript file that initializes an Elm module.

See full examples in [the examples folder](examples).

## Installing

`elm-port-helper` is not published on NPM yet. However, NPM can install directly
from GitHub:

```
npm install sidneynemzer/elm-port-helper#v1.0.1
```

Replace "1.0.0" with the version that you want (See [the list of versions](https://github.com/SidneyNemzer/elm-port-helper/releases))

## API

### `attachPorts( ports, options, app )`

The `ports` argument should be an object where the keys are the names of ports
and the values are [Port Objects](#port-object).

`options` is an object with the following keys:

* `options.listenToEmptyPorts` -- Boolean (Default: `true`)  
  Attaches a listener to ports that the Elm app exposes if you don't explicitly
  define a JavaScript handler for that port. If any of these "empty" ports are
  called by Elm, a console warning will be printed. This acts as a reminder in
  case you forget to handle a port on the JavaScript side. This warning will
  be printed regardless of `options.logging`.
* `options.warnOnIgnoredReturns` -- Boolean (Default: `true`)  
  Setting this to `true` will print a warning if the JavaScript function for a
  port returns a value but its `callback` is set to `false`. This warning
  will be printed regardless of `options.logging`.
* `options.logging` -- Boolean (Default: `logging.ERRORS`)  
  This changes what type of messages will be printed in the JavaScript console.
  See the documentation for the built-in [`logging` object](#logging) below.

Example:
```js
ElmPorts.attachPorts(ports, {
  listenToEmptyPorts: false,
  warnOnIgnoredReturns: true,
  logging: ElmPorts.logging.DEBUG
}, app)
```

### Port Object

This object defines a single JavaScript port. It should be a value in the object
passed to [`attachPorts`](#attachports-ports-options-app-)

* `port.callback` -- Boolean or Object or one of [`callback`](#callback) (Default: `false`)  
  Describes what data should be returned to elm. Set to `false` to disable.
  If a port has no callback, the `port.func` can be set directly as the value
  instead of using the Port Object.
  * `port.callback.type` -- One of [`callback`](#callback) (Default: `callback.ERROR`)  
    Defines the exact type of return. If you don't need to specify
    `port.callback.tag` and `port.callback.name`, you can just directly set
    `port.callback` to the type, instead of the full object.
  * `port.callback.tag` -- `false` or `function` (Default: `arg[0]`)  
    This function determines what to use as the callback value. The function
    should return an Object that contains the keys `tag` and `rest`. The
    tag value lets Elm track which operation just completed, and usually isn't
    used in the JavaScript side of the port. The tag is always returned to Elm
    as the first value in the result array.
  * `port.callback.name` -- String (Default: port's name + `'Finished'`)
    The name of the Elm port to send the result to. Defaults to the port's name
    plus `Finished`.
* `port.func` -- `function`  
  The actual port function. This is the JavaScript that will run when Elm calls
  the port. If it returns a Promise, elm-port-helper will wait for the Promise
  to resolve. The result of the Promise, or any plain value, will be wrapped in
  an array with the callback tag as the first value. Depending on
  `port.callback.type`, an error placeholder will be added to the array.


Example:
```js
ElmPorts.attachPorts({
  examplePort: {
    callback: {
      type: ElmPorts.callback.RESULT,
      // `tag` defaults to the first arg of the array, so here we need to
      // explicitly retrieve the tag from the end of the args.
      tag: args => ({
        tag: args[3],
        rest: args.slice(0, 3)
      }),
      // The port used to send the result to Elm
      name: 'examplePortComplete'
    },
    func: ([val0, val1, val2]) => {
      // This isn't a very useful port
      // TODO Better example?
      return val0.indexOf(val1) + val2
    }
  },
  examplePort2: message => {
    // This port has no callback, so the function is defined
    // directly as the value instead at port.func
    alert(message)
  }
}, app)
```

### `callback`

This built-in object provides the possible values for a port's callback option.
When the tag is disabled, `RESULT_OR_ERROR` is an array with the error and result
while `ERROR` and `RESULT` become a plain value (not wrapped in an array).

* `callback.RESULT_OR_ERROR`  
  Errors turn into `[tag, error, null]`. A successful result turns into
  `[tag, '', result]` (with an empty string in place of an error).
* `callback.ERROR`  
  Errors turn into `[tag, error]`. Non-errors turn into `[tag, null]`. This
  is useful when your Elm code needs to know that the operation finished,
  but the operation doesn't produce any data (for example, setting the
  page title).
* `callback.RESULT`  
  Result turns into `[tag, result]`. Errors are not sent to Elm.
* `callback.NONE`  
  Nothing is sent to Elm. This is the same as setting `port.callback` to `false`.

### `logging`

This built-in object provides the possible values for
[`attachPorts`](#attachports-ports-options-app-)' logging option.

* `logging.NONE`  
  Don't print any messages. Fatal errors will still be thrown.
* `logging.ERRORS`  
  Only print a message when a port errors or a non-fatal error is encountered
* `logging.RESULT`  
  Print any errors and whatever the result of a port is
* `logging.DEBUG`  
  Print errors, results, and internal debug info

Example:
```js
ElmPorts.attachPorts(ports, {
  logging: ElmPorts.logging.DEBUG
}, app)
```
