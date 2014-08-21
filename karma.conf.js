module.exports = function (karma) {
  karma.set({
    preprocessors: {
      'src/**/*.html': ['ng-html2js']
    },
    files: [
      'bower_components/lodash/dist/lodash.js',
      'bower_components/smooth-scroll/dist/js/smooth-scroll.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-scroll-to-me/angular-scroll-to-me.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/jquery/dist/jquery.js',
      'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
      'src/**/*.tpl.html',
      'src/**/*.js',
      'test/**/*.js'
    ],
    frameworks: [ 'jasmine' ],
    plugins: [ 'karma-jasmine', 'karma-phantomjs-launcher', 'karma-ng-html2js-preprocessor' ],

    reporters: 'dots',

    port: 9018,
    runnerPort: 9100,
    urlRoot: '/',

    autoWatch: false,

    browsers: [ 'PhantomJS' ],

    ngHtml2JsPreprocessor: {
      stripPrefix: 'src/',
      moduleName: 'templates-main'
    }
  });
};

