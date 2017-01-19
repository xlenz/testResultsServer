'use strict'

var mongoose = require('mongoose')
var limitWeek = 30
var limitMonth = 150
var limitQuarter = 450
var limitHalf = 900
var sorting = { 'timestamp': -1 }

var schema = mongoose.Schema({
  timestamp: Number,
  processName: String,
  test: Object,
  build: Object,
  env: Object
})

schema.statics.getPeriodResults = function (period) {
  if (period === '1') {
    return getAllResults(this).limit(limitWeek)
  } else if (period === '2') {
    return getPartialResults(this, limitMonth, limitWeek)
  } else if (period === '3') {
    return getPartialResults(this, limitQuarter, limitMonth)
  } else if (period === '4') {
    return getPartialResults(this, limitHalf, limitQuarter)
  } else if (period === '5') {
    return getAllResults(this).skip(limitHalf)
  } else if (period === '0') {
    return getAllResults(this)
  } else {
    return { exec: cb => cb({ message: `Unknown period: ${period}` }) }
  }
}

schema.statics.getPeriods = function (cb) {
  return this.count().exec(function (err, count) {
    if (err) return cb(err)
    let period = 1
    if (count > limitWeek) {
      period = 2
    } else if (count > limitMonth) {
      period = 3
    } else if (count > limitQuarter) {
      period = 4
    } else if (count > limitHalf) {
      period = 5
    }
    return cb(err, period)
  })
}

function getAllResults (context) {
  return context.find().sort(sorting)
}

function getPartialResults (context, limit, skip) {
  return getAllResults(context).limit(limit).skip(skip)
}

module.exports = mongoose.model('Results', schema)
