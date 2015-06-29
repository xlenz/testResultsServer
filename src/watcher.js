'use strict';
var fse = require('fs-extra');
var path = require('path');
var chokidar = require('chokidar');
var spawn = require('child_process');
var self = this;
var cfg;

module.exports = function (_cfg) {
  cfg = _cfg;
  var copyComplete = '\\' + cfg.copyCompleteFile;

  var watcher = chokidar.watch([], {
    persistent: true,
    cwd: cfg.shareFolder,
    usePolling: true,
    alwaysStat: false,
    depth: 1,
    interval: 100,
    binaryInterval: 300,

    ignorePermissionErrors: true,
    atomic: true
  });

  watcher.add(['']);
  watcher.on('add', function (filePath) {
    //look for COPY_COMPLETE in test result folder. We don't care about other files and folders there
    if (filePath.indexOf(cfg.testFolderPrefix) !== 0 || filePath.substr(-copyComplete.length) !== copyComplete) return;
    var allureFolder = filePath.split('\\')[0];
    if (allureFolder.length !== cfg.testFolderPrefix.length + cfg.testFolderSuffixLength) return;

    //notify about COPY_COMPLETE file
    log.info('Received:', filePath);

    //copy to work dir
    var allureFolderPath = path.join(cfg.shareFolder, allureFolder);
    var allureInput = path.join(cfg.rootDir, cfg.pathToWdInput, allureFolder);
    fse.copy(allureFolderPath, allureInput, function (err) {
      if (err) return log.error(err);
      log.verbose('Copied to workDir:', allureFolder);
      //delete from share
      fse.remove(allureFolderPath, function (err) {
        if (err) log.error(err);
        log.verbose('Deleted from share:', allureFolder);

        //run allure-cli
        var allureOutput = path.join(cfg.rootDir, cfg.pathToWdOutput, allureFolder);
        spawn.exec('cd ' +
          path.join(cfg.rootDir, cfg.pathToAllureBin) + //path to allure-cli bin
          ' & cmd /c ' + cfg.allureBatFile + //bat file name
          ' ' +
          allureInput + //input folder
          ' ' +
          allureOutput + //output folder
          ' ' +
          cfg.allureVersion //allure version
          , function () {
            var allureOutputData = path.join(allureOutput, 'data');
            fse.ensureDir(allureOutputData, function (err) {
              if (err) return log.error(err);

              log.verbose('allure-cli: site built.');
              //parse COPY_COMPLETE
              fse.readFile(path.join(allureInput, copyComplete), function (err, data) {
                if (err) return log.error(err);

                var lines = data.toString('utf-8').split('\n');
                //remove extra symbols from env name
                var timestamp = allureFolder.substr(-cfg.testFolderSuffixLength);
                var dbRecord = {
                  "timestamp": timestamp * 1,
                  "envName": normalizeCopyCompleteStr(lines[0].split(' ')[0]),
                  "buildNumber": normalizeCopyCompleteStr(lines[1]),
                  "processName": normalizeCopyCompleteStr(lines[2]),
                  "testType": normalizeCopyCompleteStr(lines[3])
                };
                log.verbose('COPY_COMPLETE parsed:');
                console.log(dbRecord);

                //copy test results to results dir
                fse.copy(allureOutputData, path.join(cfg.rootDir, cfg.pathToResults, timestamp, 'data'), function (err) {
                  if (err) return log.error(err);
                  log.verbose('test results copied to results folder.');

                  //backup db.json
                  var dbJsonPath = path.join(cfg.rootDir, cfg.pathToDbFile);
                  fse.copy(dbJsonPath, dbJsonPath + '.bak', function (err) {
                    if (err) log.error(err);
                    log.verbose('db.json backup created.');
                    cfg.dbJson.push(dbRecord);

                    //write db.json
                    fse.writeJson(dbJsonPath, cfg.dbJson, function (err) {
                      if (err) return log.error(err);
                      log.info('test results are now available:', timestamp);

                      //cleanup input and output work dirs
                      fse.remove(allureInput, function (err) {
                        if (err) return log.error(err);
                        log.verbose('work dir input cleaned up.');
                      });
                      fse.remove(allureOutput, function (err) {
                        if (err) return log.error(err);
                        log.verbose('work dir output cleaned up.');
                      });
                    });
                  });
                });
              });
            });
          });
      });
    });
  });
};

function normalizeCopyCompleteStr(str) {
  if (str == null) {
    log.warn('Empty or null string received.');
    return '';
  }
  return str
    .replace(/(\r\n|\n|\r)/gm, '') //remove \r \n etc
    .replace(/\"/g, ''); //remove "
}