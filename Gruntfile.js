'use strict';

module.exports = function(grunt) {

  var HTTPD_PORT = 28080 + Math.floor(Math.random() * 10);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      prodution: 'production'
    },
    copy: {
      'htaccess': { expand: true, src: '.htaccess', dest: 'production'},
      'root': { expand: true, src: '*', dest: 'production', filter: 'isFile' },
      'locales': { expand: true, src: 'locales/*', dest: 'production' },
      'css': { expand: true, src: 'assets/*.css',
               dest: 'production', filter: 'isFile' },
      'images': { expand: true, src: 'assets/images/*', dest: 'production' },
      'canvas-to-blob': {
        expand: true,
        src: 'assets/canvas-to-blob/canvas-to-blob.min.js',
        dest: 'production' }
    },
    replace: {
      dist: {
        options: {
          variables: {
            'timestamp': (new Date()).getTime().toString(36) }
        },
        files: [
          { expand: true,
            src: 'production/index.html', dist: 'production/index.html' },
          { expand: true,
            src: 'production/assets/*.js', dist: 'production/assets' },
          { expand: true,
            src: 'production/locales/locales.ini',
            dist: 'production/locales/locales.ini' }]
      }
    },
    rev: {
      dist: {
        files: {
          src: [
            'production/assets/*.js',
            'production/assets/*.css'
          ]
        }
      }
    },
    shell: {
      deploy: {
        command: 'rsync -azzvP --delete --exclude .git ' +
                 './production/ h2:timc-www/www/wordcloud/',
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
      'production/assets/go2/src/google-oauth2.js':
        'assets/go2/src/google-oauth2.js',
      'production/assets/wordfreq/src/wordfreq.worker.js':
        'assets/wordfreq/src/wordfreq.worker.js'
    },
    useminPrepare: {
      html: 'index.html',
      options: {
        dest: 'production'
      }
    },
    usemin: {
      html: 'production/*.html',
      options: {
        dirs: ['production']
      }
    },
    connect: {
      test: {
        options: {
          port: HTTPD_PORT
        }
      }
    },
    qunit: {
      test: {
        options: {
          urls: [
            'http://localhost:' + HTTPD_PORT + '/test/'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-useMin');

  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Build web app for production
  grunt.registerTask('default', [
    'clean', 'copy', 'useminPrepare',
    'concat', 'uglify', 'rev', 'usemin', 'replace']);

  // Quick shell command to rsync the code to my site
  grunt.registerTask('deploy', ['shell:deploy']);

  // Run the test suite with QUnit on PhantomJS
  grunt.registerTask('test', ['connect', 'qunit']);

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
