module.exports = function(grunt) {

  grunt.initConfig({
    sass: {
      dist: {
        options: {
          style: 'compressed'
        },
        files: {
          'public/css/main.css': 'public/css/main.scss'
        }
      }
    },
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')({browsers: ['last 2 versions']})
        ]
      },
      dist: {
        src: 'public/css/main.css'
      }
    },
    watch: {
      css: {
        files: 'public/css/**/*.scss',
        tasks: ['sass', 'postcss']
      }
    }
  });

  // load tasks
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-postcss');

  // register tasks
  grunt.registerTask('default', ['sass', 'postcss']);

};