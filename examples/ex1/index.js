// When you import elm-port-helper, you'll import from 'elm-port-helper'.
// Here, '../../' is used to import from the grandparent folder.
import ElmPorts from '../../'

// Elm files can be imported because webpack has been set up to use elm-webpack-loader
import Elm from './Main.elm'

const app = Elm.Main.fullscreen()

// Set window.app to the Elm app object for debugging
window.app = app

ElmPorts.attachPorts({
  setTitle: title => {
    window.title = title
  },
  storageSet: {
    callback: ElmPorts.callback.NONE,
    func: ([path, value]) => {
      window.localStorage[path] = value
    }
  },
  storageGet: {
    callback: ElmPorts.callback.RESULT,
    func: ([path]) => (
      window.localStorage.getItem(path) || ''
    )
  }
}, {
  logging: ElmPorts.logging.DEBUG
}, app)
