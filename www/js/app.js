'use strict';

(function () {
  var app = angular.module('testResults', []);

  app.controller('MainCtrl', function ($scope, $http) {
    $scope.testResults = [];
    $scope.testTypeFilter = {testType: undefined};
    $scope.testFilterTypes = [
      {name: 'All', value: ''},
      {name: 'Rest', value: 'rest'},
      {name: 'UI', value: 'ui'}
    ];
    $http({
      method: 'GET',
      url: '/api/results/1'
    }).success(function (data) {
      $scope.testResults = data;
    }).error(function (data) {
      console.error(data);
    });

    $scope.getDate = function (timestamp) {
      var testDate = new XDate(timestamp);
      return testDate.toString('dd MMM hh:MM:ss');//yyyy-MMM-dd
    };

    $scope.setTestTypeFilter = function (testType) {
      $scope.testTypeFilter.testType = testType;
    }
  });
})();
