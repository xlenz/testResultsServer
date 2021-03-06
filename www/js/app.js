/* global XDate */
'use strict';

(function () {
  var app = angular.module('testResults', [])

  app.controller('MainCtrl', function ($scope, $http) {
    var apiUrl = '/api/results/'
    var requestParams = {
      method: 'GET'
    }
    $scope.testResults = []
    $scope.testTypeFilter = { test: { type: undefined } }
    $scope.testFilterTypes = [
      { name: 'All', value: '' },
      { name: 'rest', value: 'rest' },
      { name: 'ui2', value: 'ui2' }
    ]

    var tr1 = $http(Object.assign({}, requestParams, { url: apiUrl + '1' }))
    tr1.error(function (data) {
      // console.error(data);
    })
    tr1.success(function (data) {
      $scope.testResults = updateTestResults(data)
      $scope.loaded = true
    })
    tr1.then(function () {
      $http(Object.assign({}, requestParams, { url: apiUrl + '2' }))
        .success(function (data) {
          Array.prototype.push.apply($scope.testResults, updateTestResults(data))
        })
    })
    tr1.then(function () {
      $http(Object.assign({}, requestParams, { url: apiUrl + '3' }))
        .success(function (data) {
          Array.prototype.push.apply($scope.testResults, updateTestResults(data))
        })
    })

    function getDate (timestamp) {
      var testDate = new XDate(timestamp)
      return testDate.toString('dd MMM HH:MM:ss')// yyyy-MMM-dd
    }

    $scope.setTestTypeFilter = function (testType) {
      $scope.testTypeFilter.test.type = testType
    }

    function updateTestResults (arr) {
      arr.forEach((element, index) => {
        // format date
        arr[index].dateTime = getDate(element.timestamp)
      })
      return arr
    }
  })
})()
