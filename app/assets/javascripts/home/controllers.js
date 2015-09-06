/**
 * Home controllers.
 */
define(['lodash'], function(_) {
  'use strict';

  /** Controls the index page */
  var HomeCtrl = function($scope, playRoutes, $location, $route) {
    $scope.search = function() {
      delete $scope.page;
      $scope.getPage();
    };

    $scope.getPage = function() {
      $scope.searchInProgress = true;
      $location.search('q', $scope.searchKey);
      $location.search('page', $scope.page);
      playRoutes.controllers.Repository.searchRepositories($scope.searchKey, $scope.page).get().success(function(response) {
        $scope.repositoriesPage = response.data.repositories;
        $scope.pageLinks = response.data.pages;
        $scope.searchInProgress = false;
      });
    };
    $scope.searchKey = $location.search().q;
    $scope.page = $location.search().page;
    if (!_.isEmpty($scope.searchKey)) {
      $scope.getPage();
    }
    $scope.goToPage = function(newPage) {
      $scope.page = newPage;
      $location.search('page', $scope.page);
      $route.reload();
    };

    $scope.goToRepository = function(owner, repository) {
      $location.url('/repositories/' + owner + '/' + repository);
    };
    $scope._ = _;
  };

  HomeCtrl.$inject = ['$scope', 'playRoutes', '$location', '$route'];

  return {
    HomeCtrl: HomeCtrl
  };

});
