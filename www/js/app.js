'use strict';

(function () {
  var app = angular.module('testResults', []);

  app.controller('MainCtrl', function ($scope, $http) {
    var apiUrl = '/api/results/';
    var requestParams = {
      method: 'GET'
    };
    $scope.testResults = [];
    $scope.testTypeFilter = { testType: undefined };
    $scope.testFilterTypes = [
      { name: 'All', value: '' },
      { name: 'rest', value: 'rest' },
      { name: 'ui2', value: 'ui2' }
    ];

    var tr1 = $http(Object.assign({}, requestParams, { url: apiUrl + '1' }));
    tr1.error(function (data) {
      //console.error(data);
    });
    tr1.success(function (data) {
      $scope.testResults = updateTestResults(data);
      $scope.loaded = true;
    });
    tr1.then(function () {
      $http(Object.assign({}, requestParams, { url: apiUrl + '2' }))
        .success(function (data) {
          Array.prototype.push.apply($scope.testResults, updateTestResults(data));
        });
    });
    tr1.then(function () {
      $http(Object.assign({}, requestParams, { url: apiUrl + '3' }))
        .success(function (data) {
          Array.prototype.push.apply($scope.testResults, updateTestResults(data));
        });
    });

    function getDate (timestamp) {
      var testDate = new XDate(timestamp);
      return testDate.toString('dd MMM HH:MM:ss');//yyyy-MMM-dd
    }

    $scope.setTestTypeFilter = function (testType) {
      $scope.testTypeFilter.testType = testType;
    };

    function updateTestResults(arr) {
      arr.forEach((element, index) => {
        // failures total
        arr[index].statistic.failures = element.statistic.failed + element.statistic.broken;

        // format date
        arr[index].dateTime = getDate(element.timestamp);

        // set build number only
        arr[index].buildNumberOnly = element.buildNumber.split('-')[0].trim();

        // set icon
        if (element.testType === 'rest') arr[index].icon = 'terminal.png';
        else if (element.testType !== 'ui2') arr[index].icon = 'unknown_test_type.png';
        else if (!element.browser) arr[index].icon = 'unknown_browser.png';
        else if (element.browser.toLowerCase().includes('chrome')) arr[index].icon = 'chrome.png';
        else if (element.browser.toLowerCase().includes('firefox')) arr[index].icon = 'firefox.png';
        else if (element.browser.toLowerCase().includes('internet explorer')) arr[index].icon = 'internet_explorer11.png';
        else if (element.browser.toLowerCase().includes('edge')) arr[index].icon = 'edge.png';
        else arr[index].icon = 'unknown_browser.png';
      });
      return arr;
    }
  });
})();
