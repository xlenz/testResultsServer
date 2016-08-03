'use strict';
var fse = require('fs-extra');
var path = require('path');
var chokidar = require('chokidar');
var spawn = require('child_process');
var Results = require('./models/Results');

var copyComplete = `/${CONFIG.copyCompleteFile}`;
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

var workers = [];

module.exports = function () {
  var watcher = chokidar.watch([], chokidarConfig);
  watcher.add(['']);

  watcher.on('add', function (filePath) {
    //look for COPY_COMPLETE in test result folder. We don't care about other files and folders there
    if (filePath.indexOf(CONFIG.testFolderPrefix) !== 0 || filePath.substr(-copyComplete.length) !== copyComplete) return;
    let allureFolder = filePath.split('/')[0];
    if (allureFolder.length !== CONFIG.testFolderPrefix.length + CONFIG.testFolderSuffixLength) return;

    //notify about COPY_COMPLETE file
    log.info(`Received: ${filePath}`);

    //copy to work dir
    let allureFolderPath = path.join(CONFIG.shareFolder, allureFolder);
    let allureInput = path.join(CONFIG.rootDir, CONFIG.pathToWdInput, allureFolder);
    let allureOutput = path.join(CONFIG.rootDir, CONFIG.pathToWdOutput, allureFolder);
    let allureOutputData = path.join(allureOutput, 'data');
    let timestamp = allureFolder.substr(-CONFIG.testFolderSuffixLength);

    log.verbose('workers:')
    log.verbose(workers)
    if (!workers.includes(timestamp)) {
      workers.push(timestamp);

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
          workers = workers.filter(e => e!==timestamp)
          return cleanUp(allureFolder, allureFolderPath, allureInput, allureOutput);
        }).catch((err) => {
          if (err.errno === -16) {
           log.error(err);
           log.warn('network share issue, retrying in 30 seconds');
            setTimeout(()=>{
             return copyToWorkDir(allureFolderPath, allureInput, allureFolder)
              .then(() => {
                return runAllureCli(allureInput, allureOutput, allureOutputData);
              }).then(() => {
                return parseCopyComplete(allureInput, timestamp);
              }).then(dbRecord => {
                return copyToResultsAndSetStatistic(dbRecord, allureOutputData, timestamp);
              }).then(dbRecord => {
                return saveResultRecord(dbRecord);
              }).then(() => {
                workers = workers.filter(e => e!==timestamp)
                return cleanUp(allureFolder, allureFolderPath, allureInput, allureOutput);
              }).catch((err) => {
                return log.error(err);
              });
            }, 30000)
          } else return log.error(err);
        });
    }
  });
};

function copyToWorkDir(allureFolderPath, allureInput, allureFolder) {
  return new Promise(function (resolve, reject) {
    log.verbose(`${Date.now()}: copyToWorkDir - start`)
    cp_copy(allureFolderPath, allureInput, (err)=>{
      if (err) return reject(err);
      log.verbose(`Copied to workDir: ${allureFolder}`);
      resolve();
    });
  });
}

function runAllureCli(allureInput, allureOutput, allureOutputData) {
  return new Promise(function (resolve, reject) {
    log.verbose(`${Date.now()}: runAllureCli - start`)
    spawn.exec('cd ' +
      path.join(CONFIG.rootDir, CONFIG.pathToAllureBin) + //path to allure-cli bin
      ` ; ./allure generate ${allureInput} -o ${allureOutput}`, () => {
        log.verbose(`${Date.now()}: runAllureCli - spawned`)
        fse.ensureDir(allureOutputData, function (err) {
          log.verbose(`${Date.now()}: runAllureCli - copied`)
          if (err) return reject(err);
          resolve();
        });
      });
  });
}

function parseCopyComplete(allureInput, timestamp) {
  return new Promise(function (resolve, reject) {
    log.verbose(`${Date.now()}: parseCopyComplete - start`)
    fse.readFile(path.join(allureInput, copyComplete), function (err, data) {
      log.verbose(`${Date.now()}: parseCopyComplete - file read`)
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
    log.verbose(`${Date.now()}: copyToResultsAndSetStatistic - start`)
    let resultsDir = path.join(CONFIG.rootDir, CONFIG.pathToResults, timestamp, 'data');

    cp_mkdirs(resultsDir, (errMkdirs)=>{
      if (errMkdirs) return reject(errMkdirs);

      cp_copy(allureOutputData, resultsDir, (errCopy)=>{
        if (errCopy) return reject(errCopy);
        log.verbose('test results copied to results folder.');

        fse.readJson(path.join(resultsDir, 'total.json'), function (errJson, totalJson) {
          log.verbose(`${Date.now()}: copyToResultsAndSetStatistic - readJson`)
          if (errJson) return reject(errJson);
          dbRecord.statistic = totalJson.statistic;
          resolve(dbRecord);
        });
      });

    });
  });
}

function saveResultRecord(dbRecord) {
  return new Promise(function (resolve, reject) {
    log.verbose(`${Date.now()}: saveResultRecord - start`)
    let result = new Results(dbRecord);
    result.save(function (err, saved) {
      log.verbose(`${Date.now()}: saveResultRecord - saved`)
      if (err) return reject(err);
      log.info(`test results are now available: ${dbRecord.timestamp}`);
      console.log(dbRecord.statistic);
      resolve();
    });
    log.verbose(`${Date.now()}: saveResultRecord - end`)
  });
}

function cleanUp(allureFolder, allureFolderPath, allureInput, allureOutput) {
  return new Promise(function (resolve, reject) {
    log.verbose(`${Date.now()}: cleanUp - start`)

    cp_rm(allureInput, (err1)=>{
      log.verbose(`${Date.now()}: cleanUp - input done`)
      if (err1) log.error(err1);
      else log.verbose(`Copied to workDir: ${allureFolder}`);

      cp_rm(allureOutput, (err2)=>{
        log.verbose(`${Date.now()}: cleanUp - output done`)
        if (err2) log.error(err2);
        else log.verbose('work dir output cleaned up.');

        cp_rm(allureFolderPath, (err3)=>{
          log.verbose(`${Date.now()}: cleanUp - share done`)
          if (err3) log.error(err3);
          else log.verbose(`Deleted from share: ${allureFolder}`);

          resolve();
        });
      });
    });

  });
}

function cp_copy(source, target, callback) {
  var execStr = `cp -rf ${source} ${target}`;
  log.info(`running: ${execStr}`);
  spawn.exec(execStr, (err, stdout, stderr) => {
    if (stdout) log.info(stdout);
    if (stderr) log.error(stderr);
    callback(err);
  });
}

function cp_rm(target, callback) {
  var execStr = `rm -rf ${target}`;
  log.info(`running: ${execStr}`);
  spawn.exec(execStr, (err, stdout, stderr) => {
    if (stdout) log.info(stdout);
    if (stderr) log.error(stderr);
    callback(err);
  });
}

function cp_mkdirs(target, callback) {
  var execStr = `mkdir -p ${target}`;
  log.info(`running: ${execStr}`);
  spawn.exec(execStr, (err, stdout, stderr) => {
    if (stdout) log.info(stdout);
    if (stderr) log.error(stderr);
    callback(err);
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