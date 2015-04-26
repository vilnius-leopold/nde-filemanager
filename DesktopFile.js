
var File          = require('./File.js'),
    child_process = require("child_process"),
    exec          = child_process.exec,
    spawn         = child_process.spawn;

function DesktopFile( options ) {
	File.call(this, options);

	this.iconPathFetcher = options.iconPathFetcher;
}

DesktopFile.prototype = Object.create(File.prototype);

DesktopFile.prototype.getDisplayName = function( callback ) {
	if ( typeof this._displayName !== 'undefined' ) {
		callback( null, this._displayName);
		return;
	}

	this.getDesktopFileProperty('Name', function( err, value ) {
		// use name in desktop file
		if ( ! err && value ) {
			this._displayName = value;

			callback( null, this._displayName );

		// use fileName
		} else {
			this.getFileName(function( err, fileName ){
				if ( err ) {
					callback( err, null );
					return;
				}

				this._displayName = fileName.replace(/\.desktop$/,'');

				callback( null, this._displayName );
			});
		}
	}.bind(this));
};

DesktopFile.prototype.getDesktopFileProperty = function( property, callback ) {
	this.getAbsolutePath(function( err, path ) {
		if ( err ) {
			callback( err, null );
			return;
		}

		var command  = 'grep -E ^' + property + '= ' + path.replace(/(["\s'$`\\])/g,'\\$1') + '  | head -1';

		exec( command, function( error, stdout, stderr ) {
			if ( error || stderr ) {
				callback( new Error('Failed to execute command:\n' + command + '\n' + error + '\n' + stderr), null );
				return;
			}

			var matchedLine = stdout  + '';

			var regex = new RegExp('^' + property + '=\\s*');

			var iconName = matchedLine.replace(regex, '').trim();

			if ( matchedLine === '' ) {
				callback( new Error('Missing icon key or value for ' + path), null );
				return;
			}

			callback( null, iconName );
		});
	}.bind(this));
};

DesktopFile.prototype.getIconPath = function( callback ) {
	this.getDesktopFileProperty('Icon', function( err, value ) {
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
		this.iconPathFetcher.getIconPath( value.replace(/\.(png)$/,''), 48, function( err, iconPath ) {
			callback( err, iconPath );
		});
	}.bind(this));
};

DesktopFile.prototype.open = function() {
	"use strict";

	this.getFileName(function( err, fileName ) {
		if ( err ) {
			console.error( err, null );
			return;
		}
		console.log('Current uid: ' + process.getuid());
		console.log('Current gid: ' + process.getgid());

		var app = spawn('/usr/bin/gtk-launch', [fileName], {
			detached: true
		});

		app.stdout.on('data', function (data) {
			console.log('stdout: ' + data);
		});

		app.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
		});

		app.on('error', function (err) {
			console.log('child process error ' + err);
			throw err;
			// window.alert('Error calling' + fileName + '\n' + err);
		});

		// app.on('close', function (code) {
		// 	console.log('child process exited with code ' + code);
		// });

		// this.getDesktopFileProperty(path, 'Exec', function( err, value ) {
		// 	var command = value.replace(/\s+%[fFuU](\s+|$)/, ' ').trim();

		// 	console.log('Opening App:', command);

		// 	spawn(command, [], {
		// 		detached: true
		// 	});
		// });
	}.bind(this));
};

DesktopFile.prototype.isHidden = function( callback ) {
	this.getDesktopFileProperty('NoDisplay', function( err, value ) {
		if ( err || ! value || value === 'false' ) {
			this._isHidden = false;
		} else {
			this._isHidden = true;
		}

		callback( null, this._isHidden );
	}.bind(this));
};

module.exports = DesktopFile;
