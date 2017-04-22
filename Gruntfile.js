module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        typescript: {
            base: {
                src: ['lib/*.ts'],
                dest: '.',
                options: {
                    target: 'es5', //or es3
                    module: "commonjs"
                }
            }
        },
        watch: {
            files: '**/*.ts',
            tasks: ['typescript']
        }
    });

    grunt.registerTask("w", 'watch');
    grunt.registerTask("build", "typescript")
    grunt.registerTask('default', 'build');
}