// `main.js` is the file that sbt-web will use as an entry point
(function(requirejs) {
  'use strict';

  // -- RequireJS config --
  requirejs.config({
    // Packages = top-level folders; loads a contained file named 'main.js"
    packages: ['common', 'home', 'repository'],
    shim: {
      'jsRoutes': {
        deps: [],
        // it's not a RequireJS module, so we have to tell it what var is returned
        exports: 'jsRoutes'
      },
      'chart': {
        deps: [],
        exports: 'chart'
      },
      // Hopefully this all will not be necessary but can be fetched from WebJars in the future
      'angular': {
        deps: ['jquery'],
        exports: 'angular'
      },
      'angular-chart': {
        deps: ['angular', 'chart'],
        exports: 'angular-chart'
      },
      'angular-route': ['angular'],
      'angular-cookies': ['angular'],
      'bootstrap': ['jquery'],
      'angular-ui-bootstrap': ['angular', 'bootstrap']
    },
    paths: {
      'requirejs': ['../lib/requirejs/require'],
      'jquery': ['../lib/jquery/jquery'],
      'angular': ['../lib/angularjs/angular'],
      'angular-route': ['../lib/angularjs/angular-route'],
      'angular-cookies': ['../lib/angularjs/angular-cookies'],
      'chart': ['../lib/chartjs/Chart'],
      'angular-chart': ['../lib/angular-chart/angular-chart'],
      'angular-ui-bootstrap': ['../lib/angular-ui-bootstrap/ui-bootstrap-tpls'],
      'bootstrap': ['../lib/bootstrap/js/bootstrap'],
      'jsRoutes': ['/jsroutes'],
      'lodash': ['../lib/lodash/lodash']
    }
  });

  requirejs.onError = function(err) {
    console.log(err);
  };

  // Load the app. This is kept minimal so it doesn't need much updating.
  require([
      'angular',
      'angular-cookies',
      'angular-route',
      'chart',
      'angular-chart',
      'jquery',
      'bootstrap',
      'angular-ui-bootstrap',
      'lodash',
      './app'],
    function(angular) {
      angular.bootstrap(document, ['app']);
    }
  );
})(requirejs);
