/**
 * Home controllers.
 */
define(['lodash', 'angular-chart'], function(_) {
  'use strict';

  /** Controls the index page */
  var RepositoryCtrl = function($scope, playRoutes, $routeParams) {

    function parseDate(input) {
      var parts = input.split('-');
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function printNumberWithZero(numberToPrint, numberOfCharacters) {
      var numberOfZeroToAdd = numberOfCharacters - Math.floor(Math.log10(numberToPrint)) - 1;
      var printedNumber = '';
      for (var i = 0; i < numberOfZeroToAdd; i++) {
        printedNumber += '0';
      }
      printedNumber += numberToPrint;
      return printedNumber;
    }

    function printDate(date) {
      return printNumberWithZero(date.getFullYear(), 4) + "-" + printNumberWithZero(date.getMonth() + 1, 2) + "-" + printNumberWithZero(date.getDate(), 2);
    }

    function getDateFromTimeLineChartEntry(entry) {
      return Object.keys(entry)[0];
    }

    function dayDiff(start, end) {
      return (end - start) / (1000 * 60 * 60 * 24);
    }

    $scope.getRepository = function() {
      playRoutes.controllers.Repository.getRepository($routeParams.owner, $routeParams.repository).get().success(function(response) {
        $scope.repository = response.data;
        $scope.contributorChartLabels = [];
        $scope.contributorChartData = [];
        var contributors = $scope.repository.contributions.contributors;
        $scope.repository.collaborators = _.sortByOrder($scope.repository.collaborators, function(collaborator) {
          return -1 * contributors[collaborator.login];
        });
        for (var author in contributors) {
          if (contributors.hasOwnProperty(author)) {
            $scope.contributorChartLabels.push(author);
            $scope.contributorChartData.push(contributors[author]);
          }
        }
        var timelineChart = $scope.repository.contributions.timeline;
        $scope.timelineChartMap = _.reduce(timelineChart, function(currentResult, entry) {
          return _.merge(entry, currentResult);
        });
        $scope.timelineChartStartDate = parseDate(getDateFromTimeLineChartEntry(timelineChart[0]));
        $scope.timelineChartStartDate.setDate($scope.timelineChartStartDate.getDate() - 1);
        $scope.timelineChartEndDate = parseDate(getDateFromTimeLineChartEntry(timelineChart[timelineChart.length - 1]));
        $scope.timelineChartPeriodCount = Math.floor(dayDiff($scope.timelineChartStartDate, $scope.timelineChartEndDate) / 30) + 1;
        $scope.timelineChartCurrentPeriod = 0;
        $scope.processTimeLineChart();
      });
    };

    $scope.processNextPeriodTimeLineChart = function(toBeAdded) {
      var anotherPeriod = $scope.timelineChartCurrentPeriod + toBeAdded;
      $scope.processAnotherPeriodTimeLineChart(anotherPeriod);
    };

    $scope.processAnotherPeriodTimeLineChart = function(anotherPeriod) {
      if (anotherPeriod >= 0 && anotherPeriod < $scope.timelineChartPeriodCount && anotherPeriod !== $scope.timelineChartCurrentPeriod) {
        $scope.timelineChartCurrentPeriod = anotherPeriod;
        $scope.processTimeLineChart();
      }
    };

    $scope.processTimeLineChart = function() {
      var endCurrentPeriod = new Date($scope.timelineChartEndDate.getTime());
      endCurrentPeriod.setDate(endCurrentPeriod.getDate() - 30 * $scope.timelineChartCurrentPeriod);
      var startCurrentPeriod = new Date($scope.timelineChartEndDate.getTime());
      startCurrentPeriod.setDate(startCurrentPeriod.getDate() - 30 * $scope.timelineChartCurrentPeriod - 30);
      if ($scope.timelineChartStartDate >= startCurrentPeriod) {
        startCurrentPeriod = $scope.timelineChartStartDate;
      }
      var timelineChart = [];
      var d = new Date(startCurrentPeriod.getTime());
      d.setDate(startCurrentPeriod.getDate() + 1);
      for (; d <= endCurrentPeriod; d.setDate(d.getDate() + 1)) {
        var entry = {};
        var dText = printDate(d);
        entry[dText] = $scope.timelineChartMap[dText] || 0;
        timelineChart.push(entry);
      }
      $scope.timelineChartLabels = [];
      $scope.timelineChartSeries = ["Commits"];
      $scope.timelineChartData = [[]];
      for (var i = 0; i < timelineChart.length; i++) {
        var date = getDateFromTimeLineChartEntry(timelineChart[i]);
        $scope.timelineChartLabels.push(date);
        $scope.timelineChartData[0].push(timelineChart[i][date]);
      }
    };

    $scope.getRepository();
  };

  RepositoryCtrl.$inject = ['$scope', 'playRoutes', '$routeParams'];

  return {
    RepositoryCtrl: RepositoryCtrl
  };

});
