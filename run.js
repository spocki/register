var os = require('os');
var request = require('request');
var fs = require('fs'); 
var _ = require('lodash');

var registry = _.get(process.env, "registry", "127.0.0.1");
var logDir = _.get(process.env, "logDir", ".");

var log4js = require('log4js');
log4js.configure({
        appenders: [
                    { type: 'console' },
                    { type: 'file', filename: logDir + '/register.log' }
                    ]
            });
var logger = log4js.getLogger();

var hosts = function() {
    var result = [];
    if (fs.existsSync('/etc/hosts')) { 
	var content = fs.readFileSync('/etc/hosts').toString();;
	var lines = content.split("\n");
	for (var l = 0 ; l < lines.length; l++) {
	    var line = _.trim(lines[l]);
	    if (line.match(/^[1-2]/)) {
		var words = _.words(line, /[0-9a-z\.]+/g);
		result.push(words);
	    }
	}
    } 
    return result;
};

var stats = function() {
    return {
	hostname: os.hostname(),
	uptime: os.uptime(),
	os: {
	    arch: os.arch(),
	    type: os.type()
	},
	mem: {
	    totalmem: os.totalmem(),
	    freemem: os.freemem()
	},
	hosts: hosts(),
	network: os.networkInterfaces(),
	cpus: os.cpus()
    }
};

var register = function() { 
    var actualStats = stats();
    var uri = 'http://' + registry + '/v1/register';
    
    logger.debug("try to send to " + uri + " ---> " + JSON.stringify(actualStats));
    var options = {
	timeout: 1000,
	uri: uri,
	method: 'POST',
	json: actualStats
    };
    
    request(options, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	    logger.debug(body.id)
	} else {
	    logger.error(error);
	    if (response) {
		logger.debug(response.statusCode);
	    }
	}
    });
};

var loop = function() { 
    register();
    setInterval(register, 30 * 1000);
};

loop();


/*
var nodestat = require('node-stat');
setInterval(function() {
    nodestat.get('stat','net','load','disk', function(err, data) {
	logger.debug(JSON.stringify(data, null, 2));
    });
}, 1000);
*/
