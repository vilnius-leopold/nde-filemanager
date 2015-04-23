var File          = require('./File.js'),
    child_process = require("child_process"),
    exec          = child_process.exec,
    spawn         = child_process.spawn;

function DesktopFile( options ) {
	File.call(this, options.fileName, options.parentDirectory);

	this.iconPathFetcher = options.iconPathFetcher;
}

DesktopFile.prototype = Object.create(File.prototype);

DesktopFile.prototype.getDisplayName = function( callback ) {
	this.getAbsolutePath(function( err, path ) {
		if ( err ) {
			callback( err, null );
			return;
		}

		this.getDesktopFileProperty(path, 'Name', function( err, value ) {
			// use name in desktop file
			if ( ! err && value ) {
				callback( null, value );

			// use fileName
			} else {
				this.getFileName(function( err, fileName ){
					if ( err ) {
						callback( err, null );
						return;
					}

					callback( null, fileName.replace(/\.desktop$/,'') );
				});
			}
		}.bind(this));
	}.bind(this));
};

DesktopFile.prototype.getDesktopFileProperty = function( path, property, callback ) {
	var command  = 'grep -E ^' + property + '= ' + path.replace(/(["\s'$`\\])/g,'\\$1') + '  | head -1';

	console.log('Command', command);

	exec( command, function( error, stdout, stderr ) {
		if ( error || stderr ) {
			callback( new Error('Failed to execute command:\n' + command + '\n' + error + '\n' + stderr), null );
			return;
		}

		var matchedLine = stdout  + '';
		console.log('matchedLine', matchedLine);

		var regex = new RegExp('^' + property + '=\\s*');

		var iconName = matchedLine.replace(regex, '').trim();

		if ( matchedLine === '' ) {
			callback( new Error('Missing icon key or value for ' + path), null );
			return;
		}

		callback( null, iconName );
	});

};

DesktopFile.prototype.getIconPath = function( callback ) {
	this.getAbsolutePath(function( err, path ) {
		if ( err ) {
			callback( err, null );
			return;
		}

		this.getDesktopFileProperty(path, 'Icon', function( err, value ) {
			if ( err ) {
				callback( err, null );
				return;
			}

			// if given abs path
			// for icon name
			if ( value.match( /^\// ) ) {
				callback( null, value );
				return;
			}

			// if only icon name (no path)
			this.iconPathFetcher.getIconPath( value, 48, function( err, iconPath ) {
				callback( err, iconPath );
			});
		}.bind(this));
	}.bind(this));
};

DesktopFile.prototype.open = function() {
	this.getFileName(function( err, fileName ) {
		if ( err ) {
			console.log( err, null );
			return;
		}

		spawn('gtk-launch', [fileName]);

		// this.getDesktopFileProperty(path, 'Exec', function( err, value ) {
		// 	var command = value.replace(/\s+%[fFuU](\s+|$)/, ' ').trim();

		// 	console.log('Opening App:', command);

		// 	spawn(command, [], {
		// 		detached: true
		// 	});
		// });
	}.bind(this));
};


module.exports = DesktopFile;
