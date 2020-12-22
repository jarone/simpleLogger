const Rotator = require('./rotator.js')
const pid = process.pid

console.log(`The rotator process ${pid} is running.`)

process.on('message', ({ paths, interval, size, unit }) => {
  console.log(`The rotator process ${pid} received message.`)

  if (!paths || !paths.length) throw new Error('path invalid')

  paths.forEach(sourcePath => {
    console.log(`The rotator process ${pid} will rotate ${sourcePath} by ${interval} & ${size}`)
    Rotator({
      sourcePath,
      interval,
      size,
      unit
    })
  })
})
