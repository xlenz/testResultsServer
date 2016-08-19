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
      $scope.testResults = data;
      $scope.loaded = true;
    });
    tr1.then(function () {
      $http(Object.assign({}, requestParams, { url: apiUrl + '2' }))
        .success(function (data) {
          Array.prototype.push.apply($scope.testResults, data);
        });
    });

    $scope.getDate = function (timestamp) {
      var testDate = new XDate(timestamp);
      return testDate.toString('dd MMM HH:MM:ss');//yyyy-MMM-dd
    };

    $scope.setTestTypeFilter = function (testType) {
      $scope.testTypeFilter.testType = testType;
    };
  });
})();
