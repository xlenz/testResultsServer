'use strict';

var Results = require('./../models/Results');

exports.getResults = function (req, res, next) {
  Results.getPeriodResults(req.params.period).exec(function (err, results) {
    if (err) return next(err, req, res, next);
    return res.send(results);
  });
};

exports.getPeriods = function (req, res, next) {
  Results.getPeriods(function (err, period) {
    if (err) return next(err, req, res, next);
    return res.send(`${period}`);
  });
};
