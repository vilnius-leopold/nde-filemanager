var fs               = require('fs'),
    rmdir            = require('rimraf'),
    mv               = require('mv'), // for moving files accross devices
    spawn            = require('child_process').spawn,
    recursiveReaddir = require('recursive-readdir'),
    async            = require('async'),
    path             = require('path'),
    File             = require('./File.js'),
    DesktopFile      = require('./DesktopFile.js'),
    DirectoryFile    = require('./DirectoryFile.js'),
    FileSorter       = require('./FileSorter.js'),
    FileFilter       = require('./FileFilter.js');

function NdeFs( options ) {
	var directoryWatchers = [];

	var sortSettings   = ['directoryFirst', 'displayName'],
	    filterSettings = ['hiddenFiles'];

	var fileSorter      = new FileSorter( sortSettings ),
	    fileFilter      = new FileFilter( filterSettings ),
	    iconPathFetcher = options.iconPathFetcher;

	this.userHome         = process.env.HOME;
	this.currentDirectory = null;

	// dirs with lower index in Array
	// override dir applications
	// with higher indices
	var applicationDirectories = [
		this.userHome  + '/.local/share/applications/',
		'/usr/share/applications/'
	];

	function addWatcher( path, handler ) {
		try {
			var watcher = fs.watch(path, handler);
			directoryWatchers.push( watcher );
		} catch(e) {
			console.error('Can not watch directory\n' + path + '\n' + e);
		}
	}

	function watchDirectory( path, handler ) {
		// unwatch last directory
		directoryWatchers.forEach(function( watcher ){
			watcher.close();
		});
		directoryWatchers = [];

		// refresh directory
		// on file changes

		// special applications view
		if ( path === 'applications://') {
			applicationDirectories.forEach(function( applicationDirectory ) {
				addWatcher( applicationDirectory, handler );
			});
		// regular directories
		} else {
			addWatcher( path, handler );
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

		var expansionFailed = false;

		path = path.replace(/(\$[A-Z_]+)/g, function(envVar){
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

	// As we only have to create a
	// virtual directory view
	// we can move the watch and
	// readdir code into a separate function
	// and use the body of sort/filter
	// as before
	// thus not duplicating the efforts
	// try to keep it dry
	//
	// Differences to opening regular
	// directory
	// - virtual path applications:// (because virtual directory / composed view)
	// - watch several directories at the same time
	// - fileList items have virtual parent applications:// and can have different real parent directories
	//
	// application root dirs
	// need to search recursively
	// watch dirs recursively

	// recursively get all files
	// applications in ~/.local override
	// applications in /usr
	// merge to final list
	// then apply sort/filter on them
	// var applicationDirectories = [
	//     '/usr/share/applications/',
	//     this.userHome + '/.local/share/applications/'
	// ];

	this.getApplicationsViewFileList = function( callback ) {
		async.map(applicationDirectories, recursiveReaddir, function( err, fileLists ){
			if ( err ) {
				callback( err, null);
				return;
			}

			var purifiedFileList     = [],
			    purifiedFileNameList = [];

			var fileList = [].concat
			                   .apply( [], fileLists )
			                   .filter(function( f ) {
			                       // filter out non-.desktop files
			                       return !! f.match(/[^\/]\.desktop$/);
			                   });

			var fileNameList = fileList.map(function( absFilePath ){
				return path.basename( absFilePath );
			});

			var fileCount = fileNameList.length;

			// As the indices of the fileList
			// and the fileNameList are the same
			// we can compare fileNames
			// but pick absFilePaths with
			// the same indices.
			// The purifiedFileNameList serves us
			// to identify duplicates
			// and the purifiedFileList is the
			// filtered collection we want to return
			for ( var i = 0; i < fileCount; i++ ) {
				var fileName = fileNameList[i];

				if ( purifiedFileNameList.indexOf( fileName ) === -1 ) {
					var absFilePath = fileList[i];

					purifiedFileNameList.push( fileName );
					purifiedFileList.push( absFilePath );
				}
			}


			callback( null, purifiedFileList );
		});
	};

	this.getFileList = function( path, callback ) {
		// special applications view
		if ( path === 'applications://') {
			this.getApplicationsViewFileList( callback );
		// regular directories
		} else {
			fs.readdir( path, function(err, fileNameList) {
				if ( err ) {
					callback( err, null );
					return;
				}

				var fileList = fileNameList.map(function( fileName ){
					return path + fileName;
				});

				callback(null, fileList);
			});
		}
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

		this.getFileList( path, function( err, fileList ) {
			var fileCount,
			    filteredCount = 0,
			    absoluteFilePath,
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

			fileSorter.onsorted = function( files ){
				this.onFiles( files );
			}.bind(this);

			for ( i = 0; i < fileCount; i++ ) {
				absoluteFilePath = fileList[i];

				this.createFileObj(absoluteFilePath, function( file ) {
					fileFilter.onPass(file,
					function( file ) {
						fileSorter.add( file );

						filteredCount++;

						if ( filteredCount === fileCount )
							fileSorter.done();
					}, function( file ) {
						filteredCount++;

						if ( filteredCount === fileCount )
							fileSorter.done();
					});
				}.bind(this));
			}

			// close file sorter
		}.bind(this));
	}.bind(this);

	// this.stat
	// is meant to deal
	// with broken symlinks
	// fs.stat will treat an
	// broken symlink as an
	// ENOENT is no file or directory error
	// which then breaks the view
	// for this directory.
	// To prevent that from happening
	// I retry with lstat if an error
	// occurs.
	// lstat will list the broken symlink
	// as a regular file instead of
	// throwing an error
	this.stat = function( path, callback ) {
		fs.stat(path, function( err, stats ){
			if ( err ) {
				fs.lstat( path, callback );
				return;
			}

			callback( err, stats );
		});
	};

	this.createFileObj = function( absoluteFilePath, callback ) {
		var file;

		this.stat(absoluteFilePath, function( err, stats ) {
			if ( err )
				throw err;

			// Directory
			if ( stats.isDirectory() ) {
				file = new DirectoryFile({
					absoluteFilePath: absoluteFilePath,
					isDirectory: true
				});

			// File
			} else {
				// Desktop App
				if ( absoluteFilePath.match(/\.desktop$/) ) {
					file = new DesktopFile({
						absoluteFilePath: absoluteFilePath,
						iconPathFetcher:  iconPathFetcher,
						isDirectory: false
					});

				// Regular File
				} else {
					file = new File({
						absoluteFilePath: absoluteFilePath,
						isDirectory: false
					});
				}

			}

			callback( file );
		});
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
						var app = spawn('/usr/bin/xdg-open', [absPath], {detached: true});

						app.on('error', function ( err ) {
							console.error('child process error ' + err);
						});
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

// We can't use the fs.rename API
// when moving files accross
// different devices/partitions
// the 'mv' library will
// take care of that for us
NdeFs.prototype.renameFile = mv;

module.exports = NdeFs;