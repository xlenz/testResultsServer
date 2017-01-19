'use strict'

// logging
global.log = require('./config/modules/winston')

// reading config file
global.CONFIG = require('./config/config')
CONFIG.rootDir = __dirname + '/'

// mongodb
require('./config/modules/mongoose')

// watch file
require('./src/watcher')()

// express
var app = require('express')()

// setup express and routes
require('./config/modules/express')(app, require('./src/routes'))

// start server
var listener = app.listen(CONFIG.port, CONFIG.host, function () {
  log.info(`Listening - ${listener.address().host || '*'}:${listener.address().port}`)
})
