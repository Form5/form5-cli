module.exports = function(cli) {
  var Pushover = require('pushover-notifications'),
      config = require('/usr/local/etc/form5.json'),
      clc = require('cli-color'),
      message = cli.args[1] !== '' ? cli.args[1] : false;

  if (config.shoutAppToken === '' || config.shoutUserToken === '') {
    cli.warn('Configuration is missing!');
    cli.notice('Go to pushover.com and get your own app and user tokens, then run form5 config to set them.');
    return;
  }

  var priorityDesc = 'Set priority';
  priorityDesc += '\n\t\t\t\t-1 = Low\tno notification';
  priorityDesc += '\n\t\t\t\t 0 = Normal\tsound, vibration, alert';
  priorityDesc += '\n\t\t\t\t 1 = High\tbypass quiet hours & highlighted in client';
  priorityDesc += '\n\t\t\t\t 2 = Emergency\trepeat every 30sec for 24hours';

  var options = cli.getopt({
    'help': {key: 'h', description: 'Show this help'},
    'title': {key: 't', args: 1, description: 'Title of message'},
    'sound': {key: 's', args: 1, description: 'Sound to play for message (see --sounds)'},
    'sounds': {description: 'Display list of available sounds'},
    'priority': {key: 'p', args: 1, description: priorityDesc},
  });

  if(options.help || !message) {
    var messageOption = '<message>';
    if (!message) {
      cli.warn('Message cannot be blank!\n');
      messageOption = clc.yellow(messageOption);
    }

    var help = [];
    help.push('USAGE: form5 shout ' + messageOption + ' [OPTIONS] , where OPTIONS are:');
    help.push(options.createHelp());
    for (var i = 0; i < help.length; i++) {
      console.log(help[i]);
    }

    return;
  }

  if(options.sounds) {
    cli.notice('Available sounds');
    var sounds = [];
    sounds.push({'name':'pushover', 'desc': 'Pushover (default)'});
    sounds.push({'name':'bike', 'desc': 'Bike'});
    sounds.push({'name':'bugle', 'desc': 'Bugle'});
    sounds.push({'name':'cashregister', 'desc': 'Cash Register'});
    sounds.push({'name':'classical', 'desc': 'Classical'});
    sounds.push({'name':'cosmic', 'desc': 'Cosmic'});
    sounds.push({'name':'falling', 'desc': 'Falling'});
    sounds.push({'name':'gamelan', 'desc': 'Gamelan'});
    sounds.push({'name':'incoming', 'desc': 'Incoming'});
    sounds.push({'name':'intermission', 'desc': 'Intermission'});
    sounds.push({'name':'magic', 'desc': 'Magic'});
    sounds.push({'name':'mechanical', 'desc': 'Mechanical'});
    sounds.push({'name':'pianobar', 'desc': 'Piano Bar'});
    sounds.push({'name':'siren', 'desc': 'Siren'});
    sounds.push({'name':'spacealarm', 'desc': 'Space Alarm'});
    sounds.push({'name':'tugboat', 'desc': 'Tug Boat'});
    sounds.push({'name':'alien', 'desc': 'Alien Alarm (long)'});
    sounds.push({'name':'climb', 'desc': 'Climb (long)'});
    sounds.push({'name':'persistent', 'desc': 'Persistent (long)'});
    sounds.push({'name':'echo', 'desc': 'Pushover Echo (long)'});
    sounds.push({'name':'updown', 'desc': 'Up Down (long)'});
    sounds.push({'name':'none', 'desc': 'None (silent)'});
    for (var i = 0; i < sounds.length; i++) {
      console.log('\t- ' + clc.blue(sounds[i].name + ': ') + sounds[i].desc);
    }
    return;
  }

  var push = new Pushover( {
    token: config.shoutAppToken,
    user: config.shoutUserToken,
    onerror: function(error) {
      cli.warn('Failed to send message!');
      cli.error('Reason: ' + error);
    },
  });

  var msg = {
    title: options.title || 'Form5',
    message: message,
    sound: options.sound || 'pushover',
    priority: options.priority || 0,
    retry: 30,
    expire: 86400
  };

  try {
    cli.notice('Attempting to send - '+msg.title+': "'+msg.message+'"');
    push.send(msg, function(err,res) {
      if (err) {
        throw err;
      }
      res = JSON.parse(res);
      if(res.status === 1) {
        cli.success('Sent successfully!');
      }
    });
  } catch(exception) {
    cli.warn('Failed to send message!');
    cli.error('Reason: ' + exception);
  }

};
