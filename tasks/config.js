var readline = require('readline'),
    async = require('async'),
    _ = require('underscore'),
    fs = require('fs'),
    clc = require('cli-color'),
    currConfig = false;

// Create a readline interface
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask string question, takes callback and returns
var ask = function(module, question, property, cb) {
  if (module) {
    question = '[form5][' + module + '] ' + question;
  } else {
    question = '[form5] ' + question;
  }
  question += '?';
  if (currConfig && currConfig.hasOwnProperty(property)) {
    question += ' (' + currConfig[property] + ')';
  }
  question += '\t';
  rl.question(question, function(answer) {
    cb(answer);
  });
};

// Ask boolean question, takes callback and returns
var askBoolean = function(module,question, cb) {
  if (module) {
    question = '[form5][' + module + '] ' + question;
  } else {
    question = '[form5] ' + question;
  }
  question += ' (Y/n)\t';
  rl.question(question, function(answer) {
    if(!answer.length || answer.toLowerCase() === 'y' ) {
      cb(true);
    } else {
      cb(false);
    }
  });
};

module.exports = function(cli) {

  async.series([
    function(cb) {
      fs.readFile('/usr/local/etc/form5.json', {encoding: 'utf-8'}, function(err, data) {
        if(!err) {
          currConfig = JSON.parse(data);
        }
        cb(null, {});
      });
    },

    function(cb) {
      if(currConfig) {
        cli.warn('You already have an existing config file, current values are displayed in brackets');
      } else {
        cli.notice('You don\'t seem to have an existing config file');
        cli.notice('Feel free to leave options empty if you don\'t intend to use them');
      }
      cb(null, {});
    },

    function(cb) {
      ask('shout','Pushover app token', 'shoutAppToken', function(value) {
        cb(null, { shoutAppToken: value });
      });
    },

    function(cb) {
      ask('shout','Pushover user/Group token', 'shoutUserToken', function(value) {
        cb(null, { shoutUserToken: value });
      });
    }
  ],
  function(err, res) {
    var options = _.extend.apply(_, res),
        config = {
          'shoutAppToken': options.shoutAppToken,
          'shoutUserToken': options.shoutUserToken
        };
    if(currConfig) {
      if (options.shoutAppToken === '') {
        config.shoutAppToken = currConfig.shoutAppToken;
      }
      if (options.shoutUserToken === '') {
        config.shoutUserToken = currConfig.shoutUserToken;
      }
    }

    async.series(
      [
        function(cb) {
          console.log(clc.white('\nform5.json ', JSON.stringify(config, null, 1)), '\n');
          askBoolean(false,'Looks good?', function(value) {
            cb((value ? null : true), { looksGood: value });
          });
        },

        function(cb) {
          fs.writeFile('/usr/local/etc/form5.json', JSON.stringify(config), function(err) {
            if(err) {
              cb(err,{ error: true, errorMessage: 'Creating config failed miserably since we couldn\'t write to file! :(' });
            } else {
              cb(null, { error: false });
            }
          });
        }
      ],
      function(err, res){
        if (err) {
          if (typeof err === 'object') {
            console.log(err);
          }
          if (res.hasOwnProperty('lookgsGood')) {
            cli.error(res[1].errorMessage);
          } else {
            cli.error('Canceled by user');
            cli.notice('Oh well no changes will be made. Run form5 config to try again.');
          }
        } else {
          cli.success('Great! Looks like your all set!');
        }

        rl.close();
      });
  });
};