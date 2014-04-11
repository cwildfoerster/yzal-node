var app    = require('http').createServer(handler),
    io     = require('socket.io').listen(app, { log: false }),
    fs     = require('fs'),
    path   = require('path'),
    url    = require('url'),
    sh     = require('execSync'),
    config = require('./config.json');

// simple mimetypes...
var mimeTypes = {
  'html' : 'text/html',
  'js'   : 'text/javascript',
  'css'  : 'text/css',
  'svg'  : 'image/svg+xml',
  'ttf'  : 'application/x-font-ttf',
  'otf'  : 'application/x-font-opentype',
  'woff' : 'application/font-woff',
  'eot'  : 'application/vnd.ms-fontobject'
};

// sort config..
for (var i = 0; i < config.groups.length; i++) {
  config.groups[i].items.sort(function(a, b) { 
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

app.listen(config.port);

// super simple server, maybe use connect or something like that?
function handler(req, res) {
  var uri = url.parse(req.url).pathname;
  if (uri === '/') {
    uri = '/client.html';
  }

  var filename = path.join(process.cwd(), uri);
  
  fs.exists(filename, function(exists) {
    // 404 Not Found
    if (!exists) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.write('404 Not Found\n');
      res.end();
      return;
    }

    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    res.writeHead(200, { 'Content-Type': mimeType });

    fs.createReadStream(filename).pipe(res);
  });
}

// checks for timers in our items and triggers them if the time has passed...
function checkTimer() {
  var now = new Date().getTime(),
      switched = false;

  for (var i = 0; i < config.groups.length; i++) {
    for (var j = 0; j < config.groups[i].items.length; j++) {
      var item = config.groups[i].items[j];

      if (typeof(item.timer) != "undefined" && item.timer.length > 0) {
        for (var k = item.timer.length -1; k >= 0 ; k--){
          // check if the time has passed...
          if (now > item.timer[k].time) {
            var state = parseInt(item.timer[k].type == 2 ? (item.state == 1 ? 0 : 1) : item.timer[k].type);
            switchInternal(item, state);
            item.timer.splice(k, 1);
            switched = true;
          }
        }
      }
    }
  }

  if (switched) {
    updateAllClients();
  }

  setTimeout(checkTimer, 1000);
}

// check forever...
checkTimer();

// get the specific remote item
function getItem(system, remote) {
  for (var i = 0; i < config.groups.length; i++) {
    for (var j = 0; j < config.groups[i].items.length; j++) {
      var item = config.groups[i].items[j];
      if (item.system == system && item.remote == remote) {
        return item;
      }
    }
  }

  console.log('invalid item: ' + system + ',' + remote);
  return null;
}

// http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

// does the low level switching
function switchInternal(item, state) {
  sh.run(config.command.format(item.system, item.remote, state));
  item.state = state;
}

// updates all clients...
function updateAllClients() {
  saveConfig();
  io.sockets.emit('update', config.groups);
}

// save config
function saveConfig() {
  fs.writeFile('config.json', JSON.stringify(config, null, 2), function(err) {
    if (err) {
      console.log('Failed to save config.json: ' + err);
    }
  });
}

io.sockets.on('connection', function(socket) {
  // update client upon connection
  socket.emit('initial', {
    "ui-settings" : config['ui-settings'],
    "groups" : config.groups
  });

  // register switch event
  socket.on('switch', function(data) {
    var item = getItem(data.system, data.remote);
    if (item != null) {
      switchInternal(item, data.state);
      updateAllClients();
    }
  });

  socket.on('timer', function(data) {
    var item = getItem(data.system, data.remote);
    if (item != null) {

      // make sure our config is able to push timers
      var timer;
      if (typeof(item.timer) != "undefined") {
        timer = item.timer;
      } else {
        timer = new Array();
        item.timer = timer;
      }

      // calculate our trigger time
      var time;
      var v = data.time.split(':');
      if (data.mode == 0) {
        time = v[0] * 24 * 60 * 1000 + v[1] * 60 * 1000;
      } else {
        // TODO calculate time..
      }
      
      // add timer
      timer.push({
        mode: data.mode,
        type: data.type,
        time: new Date().getTime() + time
      });

      updateAllClients();
    }
  });

  // register master off event. we just force ALL items to state 0!
  socket.on('master-off', function(unused) {
    for (var i = 0; i < config.groups.length; i++) {
      for (var j = 0; j < config.groups[i].items.length; j++) {
        var item = config.groups[i].items[j];
        switchInternal(item, 0);
      }
    }

    updateAllClients();
  });
});
