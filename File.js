var fs    = require('fs'),
    async = require('async'),
    exec  = require('child_process').exec;


// WARNING:
//   Caching doesn't necessarily
//   improve performance
//   V8 already does a ton of caching
//   to to prevent subsequent system calls
//   no performance improvement
//   can even harm performance!!!
function File( fN, pD) {
	var stats,
	    absolutePath,
	    isDir,
	    mimeType,
	    lastModified,
	    parentDirectory;

	this._fileName;

	(function init( fN, pD ){
		if ( ! fN || ! pD )
			throw new Error('Missing fileName and/or direcotry!');

		this._fileName        = fN;
		parentDirectory = pD.match(/\/$/) ? pD : pD + '/';
	}.bind(this)( fN, pD ));

	var getStats = function ( callback ) {
		if ( stats ) {
			callback(null, stats);
			return;
		}

		this.getAbsolutePath(function( err, absolutePath ) {
			fs.stat(absolutePath, function( err, st ) {
				stats = st;

				callback( err, stats );
			});
		});
	}.bind(this);

	this.getAbsolutePath = function( callback ) {
		if ( absolutePath ) {
			callback ( null, absolutePath );
			return;
		}

		async.parallel([
			this.getParentDirectory,
			this.getFileName
		], function( err, results ){
			absolutePath = results.join('');
			callback(err, absolutePath);
		});
	}.bind(this);

	this.getFileName = function( callback ) {
		callback( null, this._fileName );
	}.bind(this);

	this.getCachedFileName = function() {
		return this._fileName;
	};

	this.getCachedAbsolutePath = function() {
		return absolutePath;
	};

	this.getCachedLastModified = function() {
		return lastModified;
	};

	this.cachedIsDirectory = function() {
		return isDir;
	};

	File.prototype.isHidden = function( callback ) {
		console.log('Hidden File?');

		if ( typeof this._isHidden === 'undefined' )
			this._isHidden = !! this._fileName.match(/^\./);

		callback(null, this._isHidden);
	};

	File.prototype.cachedIsHidden = function() {
		console.log('Cached hidden', this._isHidden);
		return this._isHidden;
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
				// console.log('Expensive lookup:', error, stdout, stderr, command);

				if ( ! error )
					mimeType = stdout.trim();

				callback( error, mimeType );
			});
		});
	}.bind(this);

	this.getCachedMimeType = function() {
		return mimeType;
	}.bind(this);

	this.getParentDirectory = function( callback ) {
		callback( null, parentDirectory );
	}.bind(this);

	this.isDirectory = function( callback ) {
		if ( typeof isDir !== 'undefined' ) {
			callback( null, isDir );
			return;
		}

		getStats(function(err, stats){
			if ( err ) {
				callback( err, null );
				return;
			}

			isDir = stats.isDirectory();
			callback( null, isDir );
		});
	}.bind(this);

	this.getLastModified = function( callback ) {
		if ( lastModified ) {
			callback( null, lastModified );
			return;
		}

		getStats(function(err, stats){
			if ( err ) {
				callback( err, null );
				return;
			}

			lastModified = stats.mtime;
			callback( null, lastModified );
		});
	}.bind(this);
}

module.exports = File;

function Directory() {
	(function init( fN, pD ){
		if ( ! fN || ! pD )
			throw new Error('Missing fileName and/or direcotry!');

		this._fileName        = fN;
		parentDirectory = pD.match(/\/$/) ? pD : pD + '/';
	}( fN, pD ));
}

function test(){
	console.log('Running test');
	var file = new File('file.js', '/media/Share/Projects/nde-filemanager');

	var isDirectory  = file.isDirectory,
	    _isDirectory = async.memoize(isDirectory);

	console.log(_isDirectory);

	for ( var i = 0; i < 130; i++ ) {
		isDirectory(function( err, isDir ) {
			console.log('isDir', err, isDir);
		});
		// setTimeout(function(){
		// 	isDirectory(function( err, isDir ) {
		// 		console.log('isDir', err, isDir);
		// 	});
		// },1);
	}
	// setTimeout(function(){
	// 	_isDirectory(function( err, isDir ) {
	// 		console.log('isDir', err, isDir);
	// 	});
	// },10);
}

// test();

function optimize( resultFunction ) {
	var callbackBuffer = [];
	var state = 'new'; //new/running/done
	var cachedResult;

	var cacheFunction = function( callback ) {
		console.log('Running optimized function');

		if ( state === 'done' ) {
			console.log('Done Execution');
			callback( null, cachedResult );
		} else if ( state === 'running') {
			console.log('Subsequent Execution');
			callbackBuffer.push(callback);
		} else if ( state === 'new') {
			state = 'running';
			console.log('First Execution');
			callbackBuffer.push(callback);

			resultFunction(function( err, result ) {
				if ( err ) {
					state = 'new';
				} else {
					cachedResult = result;
					state = 'done';
				}

				callbackBuffer.forEach(function( cb){
					cb(err,cachedResult);
				});
			});
		}

		// not running --> run request
		// running --> queue next request callback and run them all then done
		// done --> return result
	};

	return cacheFunction;
}

module.exports = File;