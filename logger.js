const FS = require('fs')
const { fork } = require('child_process')

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  white: '\x1b[37m'
}
const ENV = process.env.NODE_ENV
const isDev = env => !env || env === 'development'
const isObject = arg => Object.prototype.toString.call(arg) === '[object Object]'
const compact = arr => arr.filter(i => i)
const pipe = fns => args => fns.reduce((arg, fn) => fn(arg), args)
const JSONStringifyMiddleware = arg => JSON.stringify(arg)
const startRotator = (paths, { interval, size, unit }) => {
  const rotator = fork('./rotatorLauncher.js')

  rotator.on('exit', (code) => {
    console.log(`The rotator process ${rotator.pid} exit by ${code}`)
  })

  rotator.send({ paths, interval, size, unit })
}

/**
 *  Logger generator
 *
 *  @options
 *    path: [OPTIONAL] the path of log file. eg: './simple.log' or '/tmp/simple.log'
 *
 *      If you don't provide the path, the log info will output into the stdout.
 *
 *    color: [OPTIONAL] the color field only for stdout in the development environment
 *
 *    levels: [OPTIONAL] the level info of log. eg: ['info', 'warn', 'error']
 *
 *      you can also provide a parameter of type Object, eg:
 *
 *        {
 *          info: { path: './info.log', color: 'green' },
 *          warn: { path: './warn.log', color: 'yellow' },
 *          error: { path: './error.log', color: 'red' },
 *          ...
 *        }
 *
 *      options.path vs levels[item].path:
 *        if you provide the path field in the item of levels,
 *        it will cover the path field of the root in options.
 *
 *      levels[item].color:
 *        the color field only for stdout in the development environment,
 *        eg: process.env.NODE_ENV === 'development'.
 *
 *    middlewares: [OPTIONAL] the Synchronise functions array to transfer the content of log
 *
 *    rotation: [OPTIONAL] the config of rotation:
 *      interval: specify the interval to rotate. eg: '10s', default is 10 seconds.
 *      size: specify the size limit to rotate. eg: '10m', default is 10MB
 *      unit: specify the cycle time unit. eg: 'hour', 'day', 'month'. default is 'minute'
 *
 *      if you do not specify rotation field, the rotator will not launcher.
 *
 */
const makeLogger = options => {
  const { path, color, levels, middlewares = [], rotation } = Object.assign({}, options)
  const defaultPath = path
  const defaultColor = color
  const makeStdoutWriter = color => {
    if (isDev(ENV) && COLORS[color]) {
      return str => console.log(`${COLORS[color]}%s\x1b[0m`, str)
    } else {
      return str => console.log(str)
    }
  }
  const makeFileWriter = path => {
    const writeStream = FS.createWriteStream(path, { flags: 'a' })

    return str => writeStream.write(str + '\n')
  }
  const makeWriter = (path = defaultPath, color = defaultColor) => {
    return path ? makeFileWriter(path) : makeStdoutWriter(color)
  }
  const writer = makeWriter()
  const writerWithMiddlewares = pipe(middlewares.concat([JSONStringifyMiddleware, writer]))
  const result = { log: writerWithMiddlewares }
  const isLevelsObject = isObject(levels)

  let paths = compact([path])
  if (isLevelsObject) paths = paths.concat(compact(Object.values(levels).map(i => i.path)))
  if (rotation && paths.length) startRotator(paths, rotation)

  if (Array.isArray(levels)) {
    levels.forEach(level => {
      result[level] = writerWithMiddlewares
    })
    return result
  }

  if (isLevelsObject) {
    Object.keys(levels).forEach(type => {
      const { path, color } = levels[type]
      result[type] = pipe(middlewares.concat([JSONStringifyMiddleware, makeWriter(path, color)]))
    })
    return result
  }

  return result
}

module.exports = makeLogger
