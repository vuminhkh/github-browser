/**
 * Home controllers.
 */
define(['lodash', 'angular-chart'], function() {
  'use strict';

  /** Controls the index page */
  var RepositoryCtrl = function($scope, playRoutes, $routeParams) {
    $scope.getRepository = function() {
      playRoutes.controllers.Repository.getRepository($routeParams.owner, $routeParams.repository).get().success(function(response) {
        $scope.repository = response.data;
        $scope.contributorChartLabels = [];
        $scope.contributorChartData = [];
        var contributors = $scope.repository.contributions.contributors;
        for (var author in contributors) {
          if (contributors.hasOwnProperty(author)) {
            $scope.contributorChartLabels.push(author);
            $scope.contributorChartData.push(contributors[author]);
          }
        }
        $scope.timelineChartLabels = [];
        $scope.timelineChartSeries = ["Commits"];
        $scope.timelineChartData = [[]];
        var timelineChart = $scope.repository.contributions.timeline;
        for (var i = 0; i < timelineChart.length; i++) {
          var date = Object.keys(timelineChart[i])[0];
          $scope.timelineChartLabels.push(date);
          $scope.timelineChartData[0].push(timelineChart[i][date]);
        }
      });
    };
    $scope.getRepository();
  };

  RepositoryCtrl.$inject = ['$scope', 'playRoutes', '$routeParams'];

  return {
    RepositoryCtrl: RepositoryCtrl
  };

});
