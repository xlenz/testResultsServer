'use strict';
var fs = require('fs');
var pathToApp = 'www';
var pathToWorkDir = 'workDir';

var config = {
  host: '',
  port: 81,

  pathToApp: pathToApp,
  appHtml: pathToApp + '/app.html',
  pageNotFound: pathToApp + '/404.html',

  pathToDbFile: 'db/db.json',
  pathToResults: 'db/results',
  pathToAllureBin: 'allure-cli/bin',
  allureBatFile: 'allure-wrap.bat',

  pathToWdInput: pathToWorkDir + '/input',
  pathToWdOutput: pathToWorkDir + '/output',

  shareFolder: '\\\\STD-FILERPRD1\\dm_builds_local\\dv\\SRA\\allureResults',
  //shareFolder: '\\\\ua006248\\Incoming\\allure',
  testFolderPrefix: 'allure-results_',
  testFolderSuffixLength: 13, //timestamp length
  copyCompleteFile: 'COPY_COMPLETE',

  allureVersion: '1.4.14'
};

var dbJson = null;
if (fs.existsSync(config.pathToDbFile || config.pathToDbFile + '.bak')) {
  try {
    dbJson = JSON.parse(fs.readFileSync(config.pathToDbFile, 'utf8'));
  } catch (err) {
    dbJson = JSON.parse(fs.readFileSync(config.pathToDbFile + '.bak', 'utf8'));
  }
} else {
  dbJson = [];
}
config.dbJson = dbJson;

module.exports = function () {
  return config;
};
