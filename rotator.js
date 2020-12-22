const PATH = require('path')
const FS = require('fs')

const zeroFilled = n => n > 9 ? ('' + n) : ('0' + n)

const formatDateLimitByUnit = (date, unit = 'hour') => {
  const mapDtByEl = {
    year: date.getFullYear(),
    month: zeroFilled(date.getMonth() + 1),
    day: zeroFilled(date.getDate()),
    hour: zeroFilled(date.getHours()),
    minute: zeroFilled(date.getMinutes())
  }

  const units = Object.keys(mapDtByEl)
  let result = ''

  units.slice(0, units.indexOf(unit) + 1).forEach((el, idx) => {
    result += `${idx ? '-' : ''}${mapDtByEl[el]}`
  })

  return result
}

const intervalMap = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000
}
const formatInterval = interval => {
  const match = interval.match(/([0-9]+)(s|m|h)/)
  return (+match[1]) * intervalMap[match[2]]
}
const sizeMap = {
  k: 1024,
  m: 1024 * 1024,
  g: 1024 * 1024 * 1024
}
const formatSize = size => {
  const match = size.match(/([0-9]+)(k|m|g)/)
  return (+match[1]) * sizeMap[match[2]]
}

const makeNewFilePath = (path, unit) => {
  const fp = PATH.parse(path)
  return fp.dir +
    '/' +
    fp.name +
    '.' +
    formatDateLimitByUnit(new Date(), unit) +
    fp.ext
}

const rotate = (path, size, unit) => {
  FS.stat(path, (err, stats) => {
    if (err) console.log(err)
    if (!stats.isFile()) console.log(`${path} isn't file.`)
    if (stats.size > size) _rotate(path, unit)
  })
}

const _rotate = (path, unit) => {
  const read = FS.createReadStream(path)
  const write = FS.createWriteStream(makeNewFilePath(path, unit), { flags: 'a' })
  const pipe = read.pipe(write)
  let error

  pipe.on('finish', () => {
    console.log('rotate finished.')
    if (error) return
    console.log('it will truncate the source file')
    FS.truncate(path, 0, err => {
      if (err) {
        console.log('truncate the source file error', err)
      } else {
        console.log('it truncated the source file')
      }
    })
  })
  pipe.on('error', err => {
    error = err
    console.log('rotate error.')
  })
}

const Rotator = options => {
  const { sourcePath, interval, size, unit = 'minute' } = options

  const timers = {}
  const intervalDigit = interval ? formatInterval(interval) : 10 * 1000
  const sizeDigit = size ? formatSize(size) : formatSize('10m')

  timers[sourcePath] = setInterval(() => {
    rotate(sourcePath, sizeDigit, unit)
  }, intervalDigit)
}

module.exports = Rotator
