'use strict';

//logging
global.log = require('./config/modules/winston');

//reading config file
var cfg = require('./config/config')();
cfg.rootDir = __dirname + '/';

//express
var express = require('express');
var app = express();

//routes
var routes = require('./src/routes')(cfg);

//setup express usages
require('./config/modules/express')(app, cfg, routes);

//watch file
require('./src/watcher')(cfg);

//start server
app.listen(cfg.port, cfg.host, function () {
  var host = cfg.host || '*';
  var port = cfg.port || 'default';
  log.info('Listening - ' + host + ':' + port);
});
