module.exports = function (karma) {
  karma.set({
    files: [
      'bower_components/lodash/dist/lodash.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/jquery/dist/jquery.js',
      'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
      'build/templates.js',
      'src/**/*.js',
      'test/**/*.js'
    ],
    frameworks: [ 'jasmine' ],
    plugins: [ 'karma-jasmine', 'karma-phantomjs-launcher' ],

    reporters: 'dots',

    port: 9018,
    runnerPort: 9100,
    urlRoot: '/',

    autoWatch: false,

    browsers: [ 'PhantomJS' ]
  });
};

