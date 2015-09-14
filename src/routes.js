'use strict';

var html = require('./controllers/html');
var data = require('./controllers/data');

exports.routes = function (app) {
  app.get('/', html.appHtml);
  app.get('/api/results/:period', data.getResults);
  app.get('/api/periods', data.getPeriods);
  app.get('/results/:timestamp', html.helper);
  app.get('/results', html.helper);
  app.get('/results/', html.helper);
  app.get('/results/:timestamp/*', html.site);
};