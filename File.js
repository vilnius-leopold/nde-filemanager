var fs    = require('fs'),
    async = require('async'),
    path  = require('path'),
    spawn = require('child_process').spawn,
    exec  = require('child_process').exec;


// WARNING:
//   Caching doesn't necessarily
//   improve performance
//   V8 already does a ton of caching
//   to to prevent subsequent system calls
//   no performance improvement
//   can even harm performance!!!
function File( options ) {
	var stats,
	    mimeType,
	    lastModified,
	    parentDirectory;

	this._absolutePath    = undefined;
	this._fileName        = undefined;
	this._displayName     = undefined;
	this._isDirectory     = undefined;
	this._parentDirectory = undefined;

	// console.log('File pre init this:',   this);


	(function init( options ){
		if ( ! options || ! options.absoluteFilePath )
			throw new Error( 'Missing options!' );

		this._absolutePath    = options.absoluteFilePath;
		this._displayName     = options.displayName; // can be undefined
		this._isDirectory     = options.isDirectory; // can be undefined
		this._fileName        = path.basename( this._absolutePath );
		this._parentDirectory = path.dirname( this._absolutePath ) + '/';
	}.bind(this)( options ));

	this._getStats = function ( callback ) {
		if ( stats ) {
			callback(null, stats);
			return;
		}

		this.getAbsolutePath(function( err, absolutePath ) {
			fs.stat(absolutePath, function( err, st ) {
				stats = st;

				if ( err )
					console.error("STATS ERROR:", err);

				callback( err, stats );
			});
		});
	}.bind(this);


	this.getCachedLastModified = function() {
		if ( ! lastModified ) throw new Error( "'lastModified' not cached!" );

		return lastModified;
	};


	// FIXME:
	// getMimeType is very slow
	// requires some kind of caching
	this.getMimeType = function( callback ) {
		this.getAbsolutePath(function( err, absolutePath ) {
			if (err) {
				callback( err, null );
				return;
			}

			var command = 'mimedb "' + absolutePath + '"';

			// CAUTION:
			// There is a max process limit
			// With large directory this limit
			// can be exceeded
			//
			// FIXME: Need to find single process solution!
			exec(command, function(error, stdout, stderr){
				if ( ! error )
					mimeType = stdout.trim();

				callback( error, mimeType );
			});
		});
	}.bind(this);

	this.getCachedMimeType = function() {
		if ( ! mimeType ) throw new Error( "'mimeType' not cached!" );

		return mimeType;
	}.bind(this);

	this.getLastModified = function( callback ) {
		if ( lastModified ) {
			callback( null, lastModified );
			return;
		}

		this._getStats(function(err, stats){
			if ( err ) {
				callback( err, null );
				return;
			}

			lastModified = stats.mtime;
			callback( null, lastModified );
		});
	}.bind(this);
}

File.prototype.cachedIsDirectory = function() {
	if ( typeof this._isDirectory === 'undefined' )
		throw new Error( "'this._isDirectory' not cached!" );

	return this._isDirectory;
};

File.prototype.isDirectory = function( callback ) {
	if ( typeof this._isDirectory !== 'undefined' ) {
		callback( null, this._isDirectory );
		return;
	}

	this._getStats(function(err, stats){
		if ( err ) {
			callback( err, null );
			return;
		}

		this._isDirectory = stats.isDirectory();
		callback( null, this._isDirectory );
	}.bind(this));
};

File.prototype.getFileName = function( callback ) {
	callback( null, this._fileName );
};

File.prototype.getCachedFileName = function() {
	if ( typeof this._fileName === 'undefined' )
		throw new Error( "'this._fileName' not cached!" );

	return this._fileName;
};

File.prototype.getAbsolutePath = function( callback ) {
	callback ( null, this._absolutePath );
};

File.prototype.getCachedAbsolutePath = function() {
	if ( typeof this._absolutePath === 'undefined' )
		throw new Error( "'this._absolutePath' not cached!" );

	return this._absolutePath;
};

File.prototype.isHidden = function( callback ) {
	if ( typeof this._isHidden === 'undefined' )
		this._isHidden = !! this._fileName.match(/^\./);

	callback(null, this._isHidden);
};

File.prototype.cachedIsHidden = function() {
	if ( typeof this._isHidden === 'undefined' )
		throw new Error( "'this._isHidden' not cached!" );

	return this._isHidden;
};

File.prototype.getParentDirectory = function( callback ) {
	callback( null, this._parentDirectory );
};

// 'displayName'is the name that should be used
// when rendering the file
// also e.g. when sorting by name
// e.g. for DesktopFile the 'fileName'
// isn't relevatn to the user
// but 'displayName' is
// == (The app name set inside .desktop file),
// OR usefull for setting custom display name
// e.g. instead of (/home/)<username> only 'Home'
// or for virtual directories like applications:
File.prototype.getDisplayName = function( callback ) {
	// check if manually overriden in constructor
	// else set displayName equal to fileName
	if ( typeof this._displayName === 'undefined' ) {
		this._displayName = this._fileName;
	}

	callback(null, this._displayName);
};

File.prototype.getCachedDisplayName = function() {
	if ( typeof this._displayName === 'undefined' )
		throw new Error( "'this._displayName' not cached!" );

	return this._displayName;
};

File.prototype.open = function() {
	this.getAbsolutePath(function(err, absPath) {
		if ( err ) {
			console.error('Failed to open file. Missing absolute Path.', err);
			return;
		}

		var app = spawn('/usr/bin/xdg-open', [absPath], {detached: true});

		app.on('error', function ( err ) {
			console.error('child process error ' + err);
		});
	}.bind(this));
};

module.exports = File;