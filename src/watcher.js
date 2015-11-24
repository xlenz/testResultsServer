'use strict';
var fse = require('fs-extra');
var path = require('path');
var chokidar = require('chokidar');
var spawn = require('child_process');
var Results = require('./models/Results');

var copyComplete = `\\${CONFIG.copyCompleteFile}`;
var chokidarConfig = {
  persistent: true,
  cwd: CONFIG.shareFolder,
  usePolling: true,
  alwaysStat: false,
  depth: 1,
  interval: 11301,
  binaryInterval: 13000,

  ignorePermissionErrors: true,
  atomic: true
};

module.exports = function () {
  var watcher = chokidar.watch([], chokidarConfig);
  watcher.add(['']);

  watcher.on('add', function (filePath) {
    //look for COPY_COMPLETE in test result folder. We don't care about other files and folders there
    if (filePath.indexOf(CONFIG.testFolderPrefix) !== 0 || filePath.substr(-copyComplete.length) !== copyComplete) return;
    let allureFolder = filePath.split('\\')[0];
    if (allureFolder.length !== CONFIG.testFolderPrefix.length + CONFIG.testFolderSuffixLength) return;

    //notify about COPY_COMPLETE file
    log.info(`Received: ${filePath}`);

    //copy to work dir
    let allureFolderPath = path.join(CONFIG.shareFolder, allureFolder);
    let allureInput = path.join(CONFIG.rootDir, CONFIG.pathToWdInput, allureFolder);
    let allureOutput = path.join(CONFIG.rootDir, CONFIG.pathToWdOutput, allureFolder);
    let allureOutputData = path.join(allureOutput, 'data');
    let timestamp = allureFolder.substr(-CONFIG.testFolderSuffixLength);

    copyToWorkDir(allureFolderPath, allureInput, allureFolder)
      .then(() => {
        return runAllureCli(allureInput, allureOutput, allureOutputData);
      }).then(() => {
        return parseCopyComplete(allureInput, timestamp);
      }).then(dbRecord => {
        return copyToResultsAndSetStatistic(dbRecord, allureOutputData, timestamp);
      }).then(dbRecord => {
        return saveResultRecord(dbRecord);
      }).then(() => {
        return cleanUp(allureFolder, allureFolderPath, allureInput, allureOutput);
      }).catch((err) => {
        return log.error(err);
      });
  });
};

function copyToWorkDir(allureFolderPath, allureInput, allureFolder) {
  return new Promise(function (resolve, reject) {
    fse.copy(allureFolderPath, allureInput, function (err) {
      if (err) return reject(err);
      log.verbose(`Copied to workDir: ${allureFolder}`);
      resolve();
    });
  });
}

function runAllureCli(allureInput, allureOutput, allureOutputData) {
  return new Promise(function (resolve, reject) {
    spawn.exec('cd ' +
      path.join(CONFIG.rootDir, CONFIG.pathToAllureBin) + //path to allure-cli bin
      ` & cmd /c ${CONFIG.allureBatFile} ${allureInput} ${allureOutput}`
      , function () {
        fse.ensureDir(allureOutputData, function (err) {
          if (err) return reject(err);
          resolve();
        });
      });
  });
}

function parseCopyComplete(allureInput, timestamp) {
  return new Promise(function (resolve, reject) {
    fse.readFile(path.join(allureInput, copyComplete), function (err, data) {
      if (err) return reject(err);

      let lines = data.toString('utf-8').split('\n');
      let dbRecord = {
        "timestamp": timestamp * 1,
        "envName": normalizeCopyCompleteStr(lines[0].split(' ')[0]), //remove extra symbols from env name
        "buildNumber": normalizeCopyCompleteStr(lines[1]),
        "processName": normalizeCopyCompleteStr(lines[2]),
        "testType": normalizeCopyCompleteStr(lines[3])
      };
      log.verbose('COPY_COMPLETE parsed:');
      console.log(dbRecord);
      resolve(dbRecord);
    });
  });
}

function copyToResultsAndSetStatistic(dbRecord, allureOutputData, timestamp) {
  return new Promise(function (resolve, reject) {
    let resultsDir = path.join(CONFIG.rootDir, CONFIG.pathToResults, timestamp, 'data');
    fse.copy(allureOutputData, resultsDir, function (errCopy) {
      if (errCopy) return reject(errCopy);
      log.verbose('test results copied to results folder.');
      fse.readJson(path.join(resultsDir, 'total.json'), function (errJson, totalJson) {
        if (errJson) return reject(errJson);
        dbRecord.statistic = totalJson.statistic;
        resolve(dbRecord);
      });
    });
  });
}

function saveResultRecord(dbRecord) {
  return new Promise(function (resolve, reject) {
    let result = new Results(dbRecord);
    result.save(function (err, saved) {
      if (err) return reject(err);
      log.info(`test results are now available: ${dbRecord.timestamp}`);
      console.log(dbRecord.statistic);
      resolve();
    });
  });
}

function cleanUp(allureFolder, allureFolderPath, allureInput, allureOutput) {
  log.verbose('cleaning up...');
  fse.remove(allureInput, function (err) {
    if (err) return log.error(err);
    log.verbose('work dir input cleaned up.');
  });
  fse.remove(allureOutput, function (err) {
    if (err) return log.error(err);
    log.verbose('work dir output cleaned up.');
  });
  fse.remove(allureFolderPath, function (err) {
    if (err) return log.error(err);
    log.verbose(`Deleted from share: ${allureFolder}`);
  });
}

function normalizeCopyCompleteStr(str) {
  if (str == null) {
    log.warn('Empty or null string received.');
    return '';
  }
  return str
    .replace(/(\r\n|\n|\r)/gm, '') //remove \r \n etc
    .replace(/"/g, ''); //remove "
}