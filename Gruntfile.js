'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    distDir: 'production',
    httpdPort: 28080 + Math.floor(Math.random() * 10),
    clean: {
      dist: '<%= distDir %>'
    },
    copy: {
      dist: {
        files: [
          { expand: true, src: '.htaccess', dest: '<%= distDir %>' },
          { expand: true, src: '*', dest: '<%= distDir %>', filter: 'isFile' },
          { expand: true, src: 'locales/*', dest: '<%= distDir %>' },
          { expand: true, src: 'assets/*.css',
            dest: '<%= distDir %>', filter: 'isFile' },
          { expand: true, src: 'assets/images/*', dest: '<%= distDir %>' },
          { expand: true,
            src: 'assets/canvas-to-blob/canvas-to-blob.min.js',
            dest: '<%= distDir %>' }
        ]
      }
    },
    'gh-pages': {
      options: {
        base: 'production'
      },
      src: '**/*'
    },
    jshint: {
      options: {
        jshintrc: true,
      },
      all: [
        'assets/*.js', 'test/**.js'
      ]
    },
    replace: {
      dist: {
        options: {
          variables: {
            'timestamp': (new Date()).getTime().toString(36) }
        },
        files: [
          { expand: true,
            src: '<%= distDir %>/index.html' },
          { expand: true,
            src: '<%= distDir %>/assets/*.js' },
          { expand: true,
            src: '<%= distDir %>/locales/locales.ini' }]
      }
    },
    rev: {
      dist: {
        files: {
          src: [
            '<%= distDir %>/assets/app.min.js',
            '<%= distDir %>/assets/*.css'
          ]
        }
      }
    },
    shell: {
      deploy: {
        command: 'rsync -azzvP --delete --exclude .git ' +
                 './production/ kanazawa:timc-www/www/wordcloud/',
        options: {
          stdout: true,
          stderr: true,
          failOnError: true
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> ' +
                ' <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: [{
          src: 'assets/go2/src/google-oauth2.js',
          dest: '<%= distDir %>/assets/go2/src/google-oauth2.js'
        },
        {
          src: 'assets/wordfreq/src/wordfreq.worker.js',
          dest: '<%= distDir %>/assets/wordfreq/src/wordfreq.worker.js'
        },
        {
          src: 'assets/downloader-worker.js',
          dest: '<%= distDir %>/assets/downloader-worker.js'
        }]
      }
    },
    useminPrepare: {
      html: 'index.html',
      options: {
        dest: '<%= distDir %>'
      }
    },
    usemin: {
      html: '<%= distDir %>/*.html',
      options: {
        dirs: ['<%= distDir %>']
      }
    },
    connect: {
      test: {
        options: {
          port: '<%= httpdPort %>'
        }
      }
    },
    qunit: {
      test: {
        options: {
          urls: [
            'http://localhost:<%= httpdPort %>/test/'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-usemin');

  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.loadNpmTasks('grunt-gh-pages');

  // Build web app for production
  grunt.registerTask('default', [
    'checkvars', 'clean', 'copy', 'useminPrepare',
    'concat', 'uglify', 'rev', 'usemin', 'replace']);

  // Quick shell command to rsync the code to my site
  grunt.registerTask('deploy-timc', ['shell:deploy']);
  grunt.registerTask('deploy', ['gh-pages']);

  // Test
  grunt.registerTask('test', ['jshint', 'test-phantomjs']);

  // Run the test suite with QUnit on PhantomJS
  grunt.registerTask('test-phantomjs', ['connect', 'qunit']);

  grunt.registerTask('checkvars', function() {
    var done = this.async();

    var fs = require('fs');
    fs.exists('./assets/vars.js', function(exists) {
      if (!exists) {
        grunt.fail.fatal('./assets/vars.js does not exist.');
      }

      done();
    });
  });

  // Simple target to check remaining client credit.
  grunt.registerTask('check-imgur-credit', function checkImgurCredit() {
    var https = require('https');
    var fs = require('fs');
    var StringDecoder = require('string_decoder').StringDecoder;

    var IMGUR_CLIENT_ID =
      (fs.readFileSync('./assets/vars.js', {
        encoding: 'utf8' }).match(/var IMGUR_CLIENT_ID = \'(.+)\';/) || [])[1];

    if (!IMGUR_CLIENT_ID) {
      grunt.fail.fatal('No IMGUR_CLIENT_ID found.');

      return;
    }
    grunt.log.writeln('IMGUR_CLIENT_ID: ' + IMGUR_CLIENT_ID);

    var done = this.async();

    https.get({
      hostname: 'api.imgur.com', path: '/3/credits',
      headers: {
        'Authorization': 'Client-ID ' + IMGUR_CLIENT_ID }
    }, function(res) {
      res.on('data', function(data) {
        var decoder = new StringDecoder('utf8');

        var response = JSON.parse(decoder.write(data));
        grunt.log.writeln('ClientLimit: ' + response.data.ClientLimit);
        grunt.log.writeln('ClientRemaining: ' + response.data.ClientRemaining);

        done(true);
      });
    }).on('error', function(err) {
      grunt.log.error(err);
      done(false);
    });
  });
};
