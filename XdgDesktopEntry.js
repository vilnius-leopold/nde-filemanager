var fs = require("fs");

/*
	- You set the desktop file path
	in the constructor

	- caching
	- refresh

	- parse all vs partial parse vs no parse
	- stream read vs line read

	- getProperty
		--> getUncommentedLines
		--> each line check prop

*/

function XdgDesktopEntry( options ) {
	if ( ! options.path )
		throw new Error('Missing desktop file path!');

	this.desktopFilePath = options.path;
	this._lines = [];
	this._lineCount = 0;
	this._onloadCallbacks = [];
	this._loading = false;
	this._loaded  = false;
}

XdgDesktopEntry.prototype.getLines = function( callback ) {
	if ( this._loaded ) {
		callback( null, this._lines );
		return;
	}

	this._onloadCallbacks.push( callback );

	if ( ! this._loading ) {
		this._loading = true;

		fs.readFile(this.desktopFilePath, { encoding: 'utf8' }, function (err, data) {
			if ( err ) {
				this._loading = false;

				this._onloadCallbacks.forEach(function( onloadCallback ){
					onloadCallback(err, null);
				}.bind(this));

				return;
			}

			this._lines = data.split('\n');
			this._lineCount = this._lines.length;
			this._loaded = true;

			this._onloadCallbacks.forEach(function( onloadCallback ){
				onloadCallback(null, this._lines);
			}.bind(this));
		}.bind(this));
	}
};

XdgDesktopEntry.prototype.setProperty = function( property, value, callback ) {
	var pattern = new RegExp('^' + property + '\\s*=\\s*'),
	    value = null;

	this.getLines(function( err, lines ) {
		if ( err ) {
			callback( err, null );
			return;
		}

		var lineCount = this._lineCount,
		    line;

		for ( var i = 0; i < lineCount; i++ ) {
			line = lines[i];

			if ( line.match(pattern) ) {
				value = line.replace(pattern, '').trim();
				value = value === '' ? null : value;
				break;
			}
		}

		callback( null, value );
	}.bind(this));
};

XdgDesktopEntry.prototype.getProperty = function( property, callback ) {
	var pattern = new RegExp('^' + property + '\\s*=\\s*'),
	    value = null;

	this.getLines(function( err, lines ) {
		if ( err ) {
			callback( err, null );
			return;
		}

		var lineCount = this._lineCount,
		    inMainSection     = false,
		    line;

		for ( var i = 0; i < lineCount; i++ ) {
			line = lines[i];

			// if passed main section
			// break search
			if ( inMainSection && line.match(/^\[/)) {
				break;
			}

			if ( ! inMainSection && line.match(/^\[\s*Desktop\s+Entry\s*\]/) ) {
				inMainSection = true;
			}


			if ( line.match(pattern) ) {
				value = line.replace(pattern, '').trim();
				value = value === '' ? null : value;
				break;
			}
		}

		callback( null, value );
	}.bind(this));
};

module.exports = XdgDesktopEntry;