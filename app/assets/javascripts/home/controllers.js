/**
 * Home controllers.
 */
define(['lodash'], function(_) {
  'use strict';

  /** Controls the index page */
  var HomeCtrl = function($scope, playRoutes, $location) {
    $scope.search = function() {
      $scope.searchInProgress = true;
      $location.search('q', $scope.searchKey);
      playRoutes.controllers.Repository.searchRepositories($scope.searchKey).get().success(function(response) {
        $scope.repositoriesPage = response.data;
        $scope.searchInProgress = false;
      });
    };
    $scope.searchKey = $location.search().q;
    if (!_.isEmpty($scope.searchKey)) {
      $scope.search($scope.searchKey);
    }
    $scope.goToRepository = function(owner, repository) {
      $location.url('/repositories/' + owner + '/' + repository);
    };
  };

  HomeCtrl.$inject = ['$scope', 'playRoutes', '$location'];

  return {
    HomeCtrl: HomeCtrl
  };

});
