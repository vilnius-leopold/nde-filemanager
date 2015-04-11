var spawn = require("child_process").spawn;

function IconPathFetcher() {
	console.log('Created Icon fetcher.');
	var command = "/home/leo/Projects/nde-filemanager/lookup_icon";
	// var command = "ls";
	console.log('command', command);

	var iconServer = spawn(command);
	console.log('Spawned server.');

	var messages  = [];
	var callbacks = [];

	iconServer.stdin.setEncoding = 'ascii';

	iconServer.stdout.on('data', function (data) {
		data = data + ' ';
		data = data.trim();

		// console.log( typeof data );
		console.log( data.split("\n") );
		// console.log( data.constructor );

		if ( ! data ) return;

		data.split("\n").forEach(function( line ) {
			line = line.trim();

			var err = line === 'Icon not found!' || line === '' ? new Error('Icon not found!') : null;

			callbacks.shift()(err, line);
		});
	});

	iconServer.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
	});

	this.getIconPath = function( iconName, iconSize, callback ) {
		if ( ! iconName || ! iconSize ) {
			if ( callback ) {
				callback( new Error('Missing iconName or iconSize'), null);
			} else {
				throw new Error('Missing parameters');
			}

			return;
		}

		var message = iconName + " " + iconSize + "\n";
		console.log('Fetching icon:', message);
		callbacks.push(callback);
		iconServer.stdin.write(message);
	};
}

function test() {
	var iconFetcher = new IconPathFetcher();

	iconFetcher.getIconPath("folder", 32, function( err, iconPath ) {
		console.log( 'Got icon:', err, iconPath );
	});
	iconFetcher.getIconPath("folder-videos", 64, function( err, iconPath ) {
		console.log( 'Got icon:', err, iconPath );
	});
	iconFetcher.getIconPath("test", 16, function( err, iconPath ) {
		console.log( 'Got icon:', err, iconPath );
	});
	iconFetcher.getIconPath("folder", 16, function( err, iconPath ) {
		console.log( 'Got icon:', err, iconPath );
	});

	iconFetcher.getIconPath("folder", 32, function( err, iconPath ) {
		console.log( 'Got icon:', err, iconPath );
	});
	iconFetcher.getIconPath("folder-videos", 64, function( err, iconPath ) {
		console.log( 'Got icon:', err, iconPath );
	});
	iconFetcher.getIconPath("test", null, function( err, iconPath ) {
		console.log( 'Got icon:', err, iconPath );
	});
	iconFetcher.getIconPath("folder", 16, function( err, iconPath ) {
		console.log( 'Got icon:', err, iconPath );
	});
}

// test();

module.exports = IconPathFetcher;