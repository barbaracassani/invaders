module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                compress : true
            },
            build: {
                src: [
                    "accessories.js",
                    "spaceinvaders.js"
                ],
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        jshint: {
            files: ['gruntfile.js', 'accessories.js', 'spaceinvaders.js'],
            options: {
                expr: true,
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint']);

    grunt.registerTask('default', ['jshint', 'uglify']);

};