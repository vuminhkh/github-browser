/**
 * Home routes.
 */
define(['angular', './controllers', 'common'], function(angular, controllers) {
  'use strict';

  var mod = angular.module('home.routes', ['com.mkv.common']);
  mod.config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/',
      {
        templateUrl: '/assets/javascripts/home/home.html',
        controller: controllers.HomeCtrl,
        reloadOnSearch: false
      })
      .otherwise({templateUrl: '/assets/javascripts/home/notFound.html'});
  }]);
  return mod;
});
