'use strict';

var express = require('express');
var cfg;

module.exports = function (app, _cfg, routes) {
  cfg = _cfg;
  var pathToPublic = cfg.pathToApp;
  //app.use(logWho);
  app.use(express.static(pathToPublic));
  routes.routes(app);
  app.use(pageNotFound);
  app.use(internalServerError);
};

function logWho(req, res, next) {
  var who = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  log.verbose(who + ' req: ' + req.headers.host + req.url);
  next();
}

function pageNotFound(req, res, next) {
  res.status(404);
  log.warn('Not found URL: ' + req.url);
  var page404 = cfg.pageNotFound;
  if (req.method === 'GET') {
    return res.sendFile(cfg.rootDir + page404);
  }
  return res.send({
    error: 'Resource not found',
    code: 404
  });
}

function internalServerError(err, req, res, next) {
  res.status(err.status || 500);
  log.error('Internal error(%d): %s', res.statusCode, err.message);
  console.log('req.body:\n', req.body);
  return res.send({
    error: err.message,
    code: 500
  });
}
