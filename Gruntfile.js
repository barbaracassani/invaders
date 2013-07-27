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
        jasmine : {
            src : 'src/js/*.js',
            host : 'http://127.0.0.1:8000/',
            options : {
                keepRunner : true,
                specs : 'specs/**/*.js',
                helpers : 'helpers/*.js',
                template: require('grunt-template-jasmine-requirejs'),
                templateOptions: {
                    requireConfigFile: 'requireconfig.js'
                },
                vendor: [
                    'src/lib/jQuery.js'
                ]
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'src/js/accessories.js', 'src/js/spaceinvaders.js'],
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
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.registerTask('test', ['jshint']);

    grunt.registerTask('default', ['jshint', 'uglify']);

};