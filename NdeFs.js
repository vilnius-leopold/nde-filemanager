var fs              = require('fs'),
    rmdir           = require('rimraf'),
    exec            = require('child_process').exec,
    File            = require('./File.js'),
    DesktopFile     = require('./DesktopFile.js'),
    IconPathFetcher = require('./IconPathFetcher.js'),
    FileSorter      = require('./FileSorter.js'),
    FileFilter      = require('./FileFilter.js');

function NdeFs() {
	var directoryWatcher;

	var sortSettings   = ['directoryFirst', 'fileName'],
	    filterSettings = ['hiddenFiles'];

	var fileSorter      = new FileSorter( sortSettings ),
	    fileFilter      = new FileFilter( filterSettings ),
	    iconPathFetcher = new IconPathFetcher();

	this.userHome         = process.env.HOME;
	this.currentDirectory = null;

	function watchDirectory( path, handler ) {
		// unwatch last directory
		if ( directoryWatcher ) directoryWatcher.close();

		// refresh directory
		// on file changes
		try {
			directoryWatcher = fs.watch(path, handler);
		} catch(e) {
			console.error('Can not watch directory\n' + path + '\n' + e);
			return;
		}
	}

	this.getParentDirectory = function() {
		var segments = this.currentDirectory.split('/');
		segments.pop();
		segments.pop();

		return (segments.join("/")) + '/';
	}.bind(this);

	var cleanPath = function( path ) {
		path = path.trim();

		if ( path.substr(path.length - 1) != '/' )
			path += '/';

		// preform bash expansion
		// var matches = path.replace(/(\$HOME)/g, function(envVar){
		// 	var envVarValue = process.env[envVar.replace(/^\$/,'')];
		// 	console.log('Found var:', envVar, envVarValue);

		// 	return '~';
		// });

		var expansionFailed = false;

		path = path.replace(/(\$[A-Z_]+)/g, function(envVar){
			console.log('Found var:', envVar);
			var envVarValue = process.env[envVar.replace(/^\$/,'')];

			if ( ! envVarValue ) {
				console.error('Unkown environment variable\n' + envVar);
				expansionFailed = true;
			}

			return envVarValue;
		});

		if ( expansionFailed )
			return null;

		path = path.replace(/^~/, this.userHome);
		path = path.replace(/^\/{2,}/, '/');

		return path;
	}.bind(this);

	this.getFilesInDirectory = function( path ) {
		path = cleanPath( path );

		if ( path === null ) {
			console.error('Invalid path\n' + path);
			return;
		}

		// refresh dir on file changes
		watchDirectory(path, function( ev, fileName ) {
			//  e.g. torrent downloads
			// the 'change' event is triggered
			// very frequently
			// to avoid constant refreshes
			// ignore change event
			if ( ev !== 'change' ) {
				this.getFilesInDirectory(path);
			}
		}.bind(this));

		fs.readdir( path, function( err, fileList ) {
			var fileCount,
			    fileName,
			    file,
			    i;

			if ( err ) {
				console.error('Can not open directory\n' + path + '\n' + err);
				return;
			}

			this.currentDirectory = path;
			this.validPathCallback( path );
			// updateHistory(path);
			// ui.setLocation( path );
			// renderHistoryButtons();
			// markBookmark(path);

			fileCount = fileList.length;

			if ( fileCount === 0 ) {
				this.onFiles( [] );
				return;
			}


			fileSorter.reset();

			fileSorter.onsorted = this.onFiles;

			for ( i = 0; i < fileCount; i++ ) {
				fileName = fileList[i];

				if ( fileName.match(/\.desktop$/) ) {
					file = new DesktopFile({
						fileName:        fileName,
						parentDirectory: this.currentDirectory,
						iconPathFetcher: iconPathFetcher
					});
				} else {
					file = new File(fileName, this.currentDirectory);
				}

				fileFilter.onPass(file, fileSorter.add);
			}

			// close file sorter
			fileSorter.add( null );
		}.bind(this));
	}.bind(this);

	this.openFile = function( file ) {
		file.isDirectory(function( err, isDir ) {
			file.getAbsolutePath(function(err, absPath) {
				if ( isDir ) {
					this.getFilesInDirectory( absPath );
				} else {
					if ( file instanceof DesktopFile ) {
						file.open();
					} else {
						var command = '/usr/bin/xdg-open "' + absPath + '"';

						exec(command);
					}
				}
			}.bind(this));
		}.bind(this));
	}.bind(this);

	this.removeFile = function( file, callback ) {
		file.getAbsolutePath(function( err, path ) {
			if ( err ) {
				if ( callback ) callback( err );
				return;
			}

			rmdir(path, function( err ) {
				if ( callback ) callback( err );
			});
		});
	}.bind(this);

	(function init() {

	}());
}

NdeFs.prototype.newFile = function( path, callback ) {
	// w - creates and opens file for writing
	// x - but throughs error if exists
	fs.open( path, 'wx', function( err, fd ){
		if ( err ) {
			callback( err );
			return;
		}

		fs.close( fd, callback );
	});
};

module.exports = NdeFs;