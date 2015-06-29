'use strict';

var self = this;
var cfg = null;

module.exports = function (_cfg) {
  cfg = _cfg;
  return self;
};

exports.dbJson = function (req, res, next) {
  return res.send(cfg.dbJson);
};
