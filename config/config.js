'use strict';
var pathToApp = 'www';
var pathToWorkDir = 'workDir';

module.exports = {
  host: '',
  port: 81,

  pathToApp: pathToApp,
  appHtml: pathToApp + '/app.html',
  pageNotFound: pathToApp + '/404.html',

  pathToResults: 'db/results',
  pathToAllureBin: 'allure-cli/bin',
  allureBatFile: 'allure-wrap.bat',

  pathToWdInput: pathToWorkDir + '/input',
  pathToWdOutput: pathToWorkDir + '/output',

  shareFolder: '\\\\STD-FILERPRD1\\dm_builds_local\\dv\\SRA\\allureResults',
  //shareFolder: '\\\\ua006248\\Incoming\\allure',
  testFolderPrefix: 'allure-results_',
  testFolderSuffixLength: 13, //timestamp length
  copyCompleteFile: 'COPY_COMPLETE'
};
