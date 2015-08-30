/**
 * Main, shows the start page and provides controllers for the header and the footer.
 * This the entry module which serves as an entry point so other modules only have to include a
 * single module.
 */
define(['angular', './routes', './controllers'], function(angular) {
  'use strict';

  return angular.module('com.mkv.repository', ['ngRoute', 'repository.routes', 'chart.js']);
});
