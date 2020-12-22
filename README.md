# The simple logger library for NodeJS

## INPUT

`options`

| Field | Type | Description | Example |
| ----- | ---- | ----------- | ------- |
| path  | String | specify the file name of output. | './logs/app.log' |
| color | String | specify the color of stdout in development. | 'green' |
| levels | Array or Object | the levels definition. | [ 'info' ] or { info: { color: 'white', path: './logs/info.log' }} |
| middlewares | Functions | the functions for modify log content | [t => t.trim(), t => t.toUpperCase()]
| rotation | Object | the config of rotation | {interval:'10s', size:'10m', unit:'day'}


all options is optional.

### All support colours:

![](https://via.placeholder.com/15/ff0000?text=+) `Red`

![](https://via.placeholder.com/15/00ff00?text=+) `Green`

![](https://via.placeholder.com/15/ffff00?text=+) `Yellow`

![](https://via.placeholder.com/15/0000ff?text=+) `Blue`

![](https://via.placeholder.com/15/ffffff?text=+) `White`

### Default Middleware:

```javascript
const JSONStringifyMiddleware = arg => JSON.stringify(arg)
```

### Specification of rotation

`interval`: specify the interval to rotate. eg: '10s', default is 10 seconds.

`size`: specify the size limit to rotate. eg: '10m', default is 10MB.

`unit`: specify the cycle time unit. eg: 'hour', 'day', 'month'. default is 'minute'.

If you do not specify rotation field, the rotator will not launcher.

Internally, the rotator launcher in child process via `child_process.fork`

## OUTPUT

output to `stdout` or `files`

### Path

If you don't provide the `path`, the log info will output into the stdout.

### Color

The `color` field only for stdout in the development environment:

`process.env.NODE_ENV === 'development'`

### `options.path` vs `levels[item].path`:

if you provide the path field in the item of levels,it will cover the path field of the root in options.

## USAGE

### One log type, output to stdout with color

```javascript
const Logger = require('./logger.js')
const options = { color: 'green' }
const { log } = Logger(options)

log(`Hi, dude~`)
```

will output to stdout:

```bash
"Hi, dude~"
```

### One log type, output to file

```javascript
const Logger = require('./logger.js')
const options = { color: './logs/app.log' }
const { log } = Logger(options)

log(`Hi, dude~`)
```

will output to file:

```bash
➜  cat ./logs/app.log

"Hi, dude~"
```

### Advanse log's options

```javascript
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
    interval:'30s',
    size: '500m',
    unit: 'hour'
  }
}
const { log, info, access, err } = Logger(options)

setInterval(() => {
  log('Hi, dude~')
  info({ msg: 'info' })
  access({ msg: 'access' })
  err({ error: 'Oops' })  
}, 100)
```

When the program runs long enough，it's will output like this:

```bash
➜  tree ./logs

logs
├── access.2020-01-01-17.log
├── access.2020-01-01-18.log
├── access.log
├── app.2020-01-01-17.log
├── app.2020-01-01-18.log
├── app.log
├── err.2020-01-01-17.log
├── err.2020-01-01-18.log
└── err.log

➜  head -n 2 ./logs/app.log

{"msg":"info"}

"Hi, dude~"

➜  head -n 1 ./logs/err.log

{"error":"Oops"}

➜  head -n 1 ./logs/access.log

{"msg":"access","ts":1608601511782}
