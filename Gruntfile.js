module.exports = function ( grunt ) {

  /**
   * Load required Grunt tasks. These are installed based on the versions listed
   * in `package.json` when you do `npm install` in this directory.
   */
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-ng-annotate');

  grunt.initConfig({

    pkg: grunt.file.readJSON("package.json"),

    build_dir: 'build',
    dist_dir: 'dist',

    files: {
      js: [ 'src/**/*.js', '!src/**/*.spec.js' ],
      tpl: [ 'src/**/*.tpl.html' ],
      jsunit: [ 'test/**/*.js' ]
    },

    /**
     * The banner is the comment that is placed at the top of our compiled
     * source files. It is first processed as a Grunt template, where the `<%=`
     * pairs are evaluated based on this very configuration object.
     */
    meta: {
      banner:
        '/**\n' +
        ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' *\n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
        ' */\n'
    },

    bump: {
      options: {
        files: [
          "package.json",
          "bower.json"
        ],
        commit: false,
        commitMessage: 'chore(release): v%VERSION%',
        commitFiles: [
          "package.json",
          "bower.json"
        ],
        createTag: false,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: false,
        pushTo: 'origin'
      }
    },

    clean: [ '<%= build_dir %>' ],

    concat: {
      options: {
        banner: '<%= meta.banner %>\n\n' +
          '(function (window, angular, undefined) {\n',
        footer: '})(window, window.angular);'
      },
      build: {
        src: [
          '<%= files.js %>',
          '<%= html2js.main.dest %>'
        ],
        dest: '<%= dist_dir %>/<%= pkg.name %>.js'
      }
    },

    ngAnnotate: {
      build: {
        src: [ '<%= concat.build.dest %>' ],
        dest: '<%= concat.build.dest %>'
      }
    },

    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      build: {
        files: {
          '<%= dist_dir %>/<%= pkg.name %>.min.js': ['<banner:meta.banner>', '<%= ngAnnotate.build.dest %>']
        }
      }
    },

    jshint: {
      src: [ '<%= files.js %>' ],
      test: [ '<%= files.jsunit %>' ],
      gruntfile: [ 'Gruntfile.js' ],
      options: {
        curly: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true,
        "-W024": true
      },
      globals: {
        angular: false
      }
    },

    html2js: {
      options: {
        base: 'src'
      },
      main: {
        src: [ '<%= files.tpl %>' ],
        dest: '<%= build_dir %>/templates.js'
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      unit: {
        singleRun: true
      }
    },

    watch: {
      files: ['src/**/*', 'test/**/*.js'],
      tasks: ['build', 'karma:unit']
    }
  });

  grunt.registerTask('default', [ 'build' ]);
  grunt.registerTask('build', [ 'clean', 'html2js', 'jshint', 'concat', 'ngAnnotate', 'uglify']);
};