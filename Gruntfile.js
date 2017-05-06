module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        typescript: {
            base: {
                src: ['lib/*.ts'],
                dest: '.',
                options: {
                    target: 'es5',
                    module: "commonjs",
                    declaration: true
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