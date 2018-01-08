import { checkArgType } from './util'

const levels = ['error', 'info', 'debug']

const levelToConsole = {
  error: console.error.bind(console),
  info: console.log.bind(console),
  debug: console.log.bind(console)
}

export default (prefix, logLevel) => {
  checkArgType('number', logLevel, 'logLevel', 1)
  return levels.reduce((logObject, level, index) => {
    logObject[level] = (...data) => {
      if (logLevel >= index) {
        levelToConsole[level](`[${prefix}] [${level}]`, ...data)
      }
    }
    return logObject
  }, {})
}
