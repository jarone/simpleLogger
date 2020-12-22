const Logger = require('./logger.js')
const options = {
  path: './logs/app.log',
  levels: {
    info: {},
    access: { path: './logs/access.log' },
    err: { path: './logs/err.log' }
  },
  middlewares: [
    arg => {
      if (arg.msg === 'access') arg.ts = Date.now()
      return arg
    }
  ],
  rotation: {
    interval: '10s',
    size: '1k'
  }
}
const { log, info, access, err } = Logger(options)

let i = 0
let j = 0
let k = 0
let m = 0

setInterval(() => {
  log({ id: m++, msg: 'Hi, dude~' })
  info({ id: i++, msg: 'info' })
  access({ id: j++, msg: 'access' })
  err({ id: k++, error: 'Oops' })
}, 100)
