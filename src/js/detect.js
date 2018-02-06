import * as R from 'ramda'

export const looksLikeOptions = maybeOptions =>
  R.has('listenToEmptyPorts', maybeOptions)
  || R.has('warnOnIgnoredReturns', maybeOptions)
  || R.has('logging', maybeOptions)

export const looksLikeApp = R.has('ports')

export const looksLikePromise = maybePromise =>
  maybePromise && typeof maybePromise.then === 'function'

export const isInputPort = R.has('send')

export const countAppPorts = app =>
  Object.keys(app.ports)
    .reduce(
      (ports, portName) =>
        R.over(
          isInputPort(app.ports[portName]) ? R.lensProp('input') : R.lensProp('output'),
          R.inc,
          ports
        ),
      { input: 0, output: 0 }
    )
