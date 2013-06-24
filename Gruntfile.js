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

  // Default task(s).
  grunt.registerTask('default',
      ['clean', 'copy', 'useminPrepare', 'concat', 'uglify', 'usemin']);
  grunt.registerTask('deploy', ['shell:deploy']);
};
