'use strict';

var readline = require('readline'),
    async = require('async'),
    _ = require('underscore'),
    git = require('nodegit'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn;

// Create a readline interface
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask boolean question, takes callback and returns
var askBoolean = function(question, cb) {
  question = '[form5][init] ' + question +  ' (Y/n)\t';
  rl.question(question, function(answer) {
    if(!answer.length || answer.toLowerCase() === 'y' ) {
      cb(true);
    } else {
      cb(false);
    }
  });
};

// Where the task magic happens
module.exports = function(cli) {

  async.series(
    [
      function(cb) {
        askBoolean('Install gulp-blender?', function(gulpBlender) {
          cb(null, { gulpBlender: gulpBlender });
        });
      },

      function(cb) {
        askBoolean('Install CreSS css framework? ', function(cress) {
          cb(null, { cress: cress });
        });
      }
    ],
    function(err, results) {
      var options = _.extend.apply(_, results);

      async.series(
        [
          function(cb) {
            // If we got projectName as an argument, let's create a folder
            // and configure the dir option.
            if(cli.args.length > 1) {
              var projectName = cli.args[1];
              fs.mkdir(projectName, function(err) {
                if(err) {
                  if(err.code === 'EEXIST') {
                    cli.warn('Note: Folder ' + projectName + ' already exists.');
                    options.dir = path.resolve(projectName);
                  } else {
                    cli.error('Error, aborting.');
                    cli.error(err);
                    process.exit(1);
                  }
                } else {
                  cli.notice('Folder ' + projectName + ' created');
                  options.dir = path.resolve(projectName);
                }

                cb(null);
              });
            } else {
              // Else we set the directory as the directory where form5-cli
              // is being executed.
              options.dir = process.cwd();
              cb(null);
            }
          },
          function(cb) {
            fs.exists(options.dir + '/.git', function(exists) {
              if(exists) {
                cli.warn('Already in a .git repository.');
                cb(null);
              } else {
                exec('git init ' + options.dir, function(error, stdout) {
                  console.log(stdout);
                  cb(null);
                });
              }
            });
          },
          function(cb) {
            if(options.gulpBlender) {
              cli.notice('Installing gulp-blender')
              exec('cd ' + options.dir + ' && git pull git@github.com:Form5/gulp-blender.git && npm install', function(error, stdout) {
                console.log(stdout);
                cb(null);
              });
            } else {
              cb(null);
            }
          },
          function(cb) {
            if(options.gulpBlender) {
              cli.notice('Installing CreSS CSS framework')
              exec('cd ' + options.dir + ' && gulp cress', function(error, stdout) {
                console.log(stdout);
                cb(null);
              });
            } else {
              cb(null);
            }
          },

        ],
        function(err, results) {

          askBoolean('Run development server and open Sublime Text?', function(answer) {
            if(answer) {
              spawn('subl', ['.'], { cwd: options.dir });
              var server = spawn('gulp', ['server'], { cwd: options.dir });

              server.stdout.on('data', function(data) {
                console.log(data.toString());
              });

            } else {
              console.log('All done!');
              rl.close();
            }
          })
        }
      );
    }
  );
};
