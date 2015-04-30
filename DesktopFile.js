
var File          = require('./File.js'),
    child_process = require("child_process"),
    exec          = child_process.exec,
    execFile      = child_process.execFile,
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

		this.getDesktopFileProperty('Exec', function( err, value ) {
			if ( err ) throw err;

			console.log('Exec=', value);

			var commandString   = value.replace(/\s+%[fFuU](\s+|$)/, ' ').trim(),
			    commandSegments = commandString.split(/\s+/),
			    command         = commandSegments.shift();

			console.log('Opening App:', command, commandSegments);

			var app = spawn(command, commandSegments, {
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

			app.on('close', function (code) {
				console.log('child process exited with code ' + code);
			});
		}.bind(this));
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
DesktopFile.prototype.getFilePackageOwner = function( absPath, callback ) {
	execFile('/usr/bin/pacman', ['-Qo', absPath.trim()], function( error, stdout, stderr ) {
		console.log('Error', error);
		console.log('stderr', stderr);
		console.log('stdout', stdout);
		if ( error || stderr ) {
			callback(new Error('Package owner could not be determined\n' + error + '\n' + stderr), null);
		} else {
			var packageString = stdout.split(' is owned by ')[1];
			var segments = packageString.split(/\s+/);
			var packageName = segments[0];
			var packageVersion = segments[1];

			console.log( 'packageName', packageName );
			console.log( 'packageVersion', packageVersion );
			callback( null, packageName );
		}
	});
};

DesktopFile.prototype.getPackageNameByExecutableName = function( fileName, callback ) {
	execFile('/usr/bin/which', [fileName.trim()], function( error, stdout, stderr ) {
		console.log('Which Error', error);
		console.log('Which stderr', stderr);
		console.log('Which stdout', stdout);
		if ( error || stderr ) {
			callback(new Error('No executable exists with this name: ' + fileName + '\n' + error + '\n' + stderr), null);
		} else {
			this.getFilePackageOwner(stdout, callback);
		}
	}.bind(this));
};

DesktopFile.prototype.getPackageName = function( callback ) {
	this.getAbsolutePath(function( err, absPath ) {
		if ( err ) {
			callback ( new Error('Failed to get associated package name\n' + err), null);
			return;
		}

		this.getFilePackageOwner(absPath, function( err, packagName ) {
			if ( err ) {
				// if the desktop file is
				// not under /usr/share/applications/
				// then we suspect that it might
				// be a custom .desktop file
				// possibly to override an existing
				// .desktop file in /usr/share/applications.
				// So will check if there is a matching .desktop
				// file in /usr/share/applications/
				if ( ! absPath.match(/^\/usr\/share\/applications\//) ) {
					this.getFileName(function( err, fileName ) {
						if ( err ) {
							callback ( new Error('Failed to get associated package name\n' + err), null);
							return;
						}

						this.getFilePackageOwner('/usr/share/applications/' + fileName, function( err, packagName ) {
							if ( err ) {

								this.getPackageNameByExecutableName(fileName.replace(/\.desktop$/, ''), callback);
								return;
							}

							callback( null, packagName );
						}.bind(this));
					}.bind(this));
				}
			} else {
				callback( null, packagName );
			}
		}.bind(this));
	}.bind(this));
};

DesktopFile.prototype.edit = function( callback ) {
	this._getStats(function(err, stats) {
		console.log('Mode:', parseInt(stats.mode, 8) );
	});

	File.prototype.open.call(this, callback);
};

DesktopFile.prototype.uninstall = function( callback ) {
	this.getPackageName(function( err, packageName ) {
		if ( err ) {
			console.log('Failed to determine associated Package.\n' + err);
			callback(new Error('Failed to determine associated Package.\n' + err), null)
			return;
		}

		// the sudo -k option
		// ensures that the user always
		// has to enter his password
		var uninstallCommand = 'sudo -k pacman -Rs ' + packageName;
		    terminalCommand  = 'gnome-terminal -x bash -c "echo \\"Running \'' + uninstallCommand + '\'\\"; ' + uninstallCommand + ' && echo \\"Successfully uninstalled\\"; sleep 3"';

		console.log('uninstallCommand', uninstallCommand);
		console.log('terminal command', terminalCommand);

		exec(terminalCommand);
	});
};

module.exports = DesktopFile;
