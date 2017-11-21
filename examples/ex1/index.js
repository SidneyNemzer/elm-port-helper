import { callbacks, portWrapper } from 'elm-port-helper'

const storage = firebase.storage()

const attachPorts = portWrapper({
  storagePut: { // This is the name of the port. It should be the same as the port in Elm.
    callback: {
      type: callbacks.ERROR, // Report errors to Elm through the port. No data will be returned.
      tag: args => ({
        tag: args[3],
        rest: args.slice(0, 3)
      }) // tag defaults to the first arg
    },
    func: ([path, content, type]) => (
      storage.refFromURL(path)
        .putString(content, firebase.storage.StringFormat.RAW, {contentType: type})
    )
    // Notice that func returns a promise
  },
  storageGet: {
    // This port returns data or an error
    // The first element of the arg is used as the tag
    callback: callbacks.RESULT_OR_ERROR
    func: path => (
      storage.refFromURL(path)
        .getDownloadURL()
        .then(fetch)
        .then(res => res.text())
    )
  }
})
