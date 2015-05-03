var cp     = require('child_process'),
    assert = require('assert');


function writeFileAsRoot( filename, data, options, callback ) {
	var fsOptions = {};

	assert( typeof filename === 'string', 'filename has to be a string');
	assert( typeof data === 'string', 'data has to be a string');

	if ( typeof callback === 'undefined' ){
		callback  = options;
	} else {
		fsOptions = options;
	}

	assert( typeof fsOptions === 'object', 'options has to be an object');
	assert( typeof callback === 'function', 'callback has to be an function');

	var rootExecPath = options.rootExecPath || '/usr/bin/gksudo',
	    rootExecArgs = options.rootExecArgs || [],
	    processData  = [filename, data, fsOptions],
	    args         = rootExecArgs.concat([
			'/usr/bin/node',
			__dirname + '/RootFs.js',
			JSON.stringify( processData )
		]);

	var child = cp.spawn( rootExecPath, args);

	var processMessages = [];

	function saveMessages(data) {
		var lines = data.split('\n').filter( function(l) { return l !== ''});

		processMessages = processMessages.concat( lines );
	}

	child.stdout.setEncoding('utf8');
	child.stderr.setEncoding('utf8');


	child.stdout.on('data', saveMessages);
	child.stderr.on('data', saveMessages);

	child.on('error', callback);

	child.on('exit', function ( code ) {
		if ( code !== 0 ) {
			var err = new Error('Process exited with non-zero value.');

			err.exitCode        = code;
			err.processMessages = processMessages;

			callback( err );
			return;
		}

		callback( null );
	});
}

module.exports = writeFileAsRoot;

/*
var child = cp.spawn('/usr/bin/gksudo', [
	'/usr/bin/node',
	'/home/leo/Projects/nde-filemanager/testing/RootFs.js',
	'/home/leo/root-node-test.txt',
	"Lorem ipsum dolor sit amet, ⁘ ⁙ ⁚ ⁛ ⁜ consectetur adipiscing elit. Fusce massa odio, \nvolutpat at placerat at, tempor a leo. Pellentesque pulvinar rutrum porttitor. Quisque hendrerit massa leo, a tristique libero venenatis vel. Vivamus posuere aliquam vehicula. Nunc egestas elementum erat fermentum tristique. Nam ullamcorper aliquam quam a efficitur. Suspendisse ornare diam risus, sed luctus ex iaculis nec. Donec pharetra est tincidunt arcu pulvinar luctus. Vivamus eget libero justo. Donec volutpat, magna et maximus molestie, dolor est sodales lacus, gravida maximus dui odio sit amet purus.Curabitur tempus, eros eu mollis tincidunt, lectus enim faucibus lorem, non faucibus lacus erat at dolor. Praesent facilisis, nunc sit amet elementum finibus, erat risus viverra ligula, et dapibus massa turpis non dolor. Maecenas vitae lectus nisl. Morbi eget egestas magna, vitae consectetur felis. Maecenas molestie est orci, nec elementum ex lobortis et. Vestibulum eu tortor risus. Sed vehicula mauris vel lacus vestibulum facilisis. Aliquam vestibulum bibendum hendrerit.Proin \neget nunc vel elit volutpat tincidunt nec eu justo. Ut non efficitur nulla. Mauris venenatis vehicula porttitor. Duis tincidunt ac lorem id suscipit. Aliquam pulvinar sem quis efficitur congue. Morbi ultricies, tellus et suscipit sodales, diam nisi rutrum libero, at pulvinar felis libero iaculis dui. Ut ut blandit lectus. Nam vulputate massa nec facilisis elementum. Nullam leo justo, ornare eget lectus vitae, faucibus congue dui. Pellentesque in mi quis tellus tincidunt luctus pellentesque sit amet urna. Aenean non dictum augue, at vestibulum purus. Proin viverra, mauris non condimentum faucibus, diam erat efficitur libero, sed dapibus ex ipsum at orci. Suspendisse in feugiat urna, at pretium metus. Aliquam eget ultricies enim. Vivamus sodales tellus leo, quis luctus libero pellentesque ut.Vestibulum at eros nisi. Donec volutpat turpis id dolor porta, egestas fringilla tortor dictum. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nulla rhoncus, erat quis faucibus scelerisque, justo mi pretium\nrisus, vel vehicula sem nunc nec velit. Fusce dignissim egestas arcu lacinia dictum. Nullam sed orci sed urna venenatis dapibus. Morbi vel eros nisl. Aenean lacinia ultrices risus ac semper. Donec lorem justo, molestie quis est et, elementum sagittis tellus. Praesent ut erat quis sapien efficitur molestie. Morbi purus tellus, rutrum quis tellus id, accumsan lacinia enim. Etiam fringilla quam et orci commodo egestas. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Pellentesque sed magna turpis.Morbi ornare metus velit, a iaculis nisl pulvinar eget. Curabitur consectetur lacus a porttitor pharetra. Fusce quis scelerisque purus. Nulla\nerat dui, mattis non nulla eu, dignissim malesuada nulla. Integer molestie dignissim malesuada. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec feugiat tortor eget enim scelerisque ultrices. Curabitur posuere nisi a nunc efficitur eleifend. Cras quis molestie quam. "
]);
console.log('Inparent: Test test');

child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');

child.stdout.on('data', function (data) {
	console.log('child stdout | ' + data);
});

child.stderr.on('data', function (data) {
	console.log('child stderr | ' + data);
});

child.on('close', function (code) {
	console.log('child process exited with code ' + code);
});

child.on('error', function(err) {
	console.log('error: ', err);
});

child.on('message', function(m) {
	// Receive results from child process
	// return success message
	console.log('received: ' + m);
});

child.on('exit', function (code, signal) {
	console.log('Child exited:', code, signal);
});
*/