/**
 * Home routes.
 */
define(['angular', './controllers', 'common'], function(angular, controllers) {
  'use strict';

  var mod = angular.module('repository.routes', ['com.mkv.common']);
  mod.config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/repositories/:owner/:repository',
      {
        templateUrl: '/assets/javascripts/repository/repository.html',
        controller: controllers.RepositoryCtrl
      })
      .otherwise({templateUrl: '/assets/javascripts/home/notFound.html'});
  }]);
  return mod;
});
