'use strict';

var self = this;
var html, data;

module.exports = function (cfg) {
  html = require('./controllers/html')(cfg);
  data = require('./controllers/data')(cfg);
  return self;
};

exports.routes = function (app) {
  app.get('/', html.appHtml);
  app.get('/resultsJson', data.dbJson);
  app.get('/results/:timestamp', html.helper);
  app.get('/results', html.helper);
  app.get('/results/', html.helper);
  app.get('/results/:timestamp/*', html.site);
};
