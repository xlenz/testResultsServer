'use strict';

var fs = require('fs');
var winston = require('winston');

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

var logger = new (winston.Logger)({
  transports: [
    //using debug to print json :)
    //new (winston.transports.Console)({
    //  name: 'jsonPrint',
    //  level: 'debug',
    //  colorize: false,
    //  json: true,
    //  showLevel: false,
    //  formatter: function(options) {
    //    // Return string will be passed to logger.
    //    if (options.level.toLowerCase() === 'debug') {
    //      return options.message;
    //    }
    //    return null;
    //  }
    //}),
    //this one used for everything else
    new (winston.transports.Console)({
      name: 'consolePrint',
      level: 'verbose',
      colorize: true
    }),
    //this one to write errors to file
    new (winston.transports.File)({
      level: 'error',
      filename: 'logs/exceptions.log',
      json: true,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 2
    })
  ],
  exceptionHandlers: [
    //want to see exception in logs
    new (winston.transports.Console)({
      colorize: true,
      prettyPrint: true,
      depth: 0
    }),
    //exceptions are also saved to files
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      json: true,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 2
    })
  ],
  exitOnError: false
});

module.exports = logger;

if (!String.prototype.format) {
  String.prototype.format = function () {
    var str = this.toString();
    if (!arguments.length) {
      return str;
    }
    var argType = typeof arguments[0];
    var args = arguments;
    if ('string' !== argType && 'number' !== argType) {
      args = arguments[0];
    }
    Object.keys(args).forEach(function (arg) {
      str = str.replace(new RegExp('\\{' + arg + '\\}', 'gi'), args[arg]);
    });
    return str;
  };
}
