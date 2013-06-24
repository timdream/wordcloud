'use strict';

module.exports = function(grunt) {

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
        dest: 'production' },
      'go2': {
        expand: true,
        src: 'assets/go2/src/google-oauth2.js',
        dest: 'production' }
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
        'production/assets/go2/src/google-oauth2.js'
    },
    useminPrepare: {
      html: 'index.html',
      options: {
        dest: 'production'
      }
    },
    usemin: {
      html: 'production/index.html',
      options: {
        dirs: ['assets']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-useMin');

  // Build web app for production
  grunt.registerTask('default',
      ['clean', 'copy', 'useminPrepare', 'concat', 'uglify', 'usemin']);

  // Quick shell command to rsync the code to my site
  grunt.registerTask('deploy', ['shell:deploy']);

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
