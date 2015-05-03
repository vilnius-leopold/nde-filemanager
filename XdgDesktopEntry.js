var fs = require("fs"),
    writeFileAsRoot = require("./testing/fs.writeFileAsRoot.js");

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
	this._mainSectionStartLine = null;
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
	var propertyLine = property + '=' + value,
	    linesCopy    = this._lines.slice(); // Make copy, don't operate on original

	this.getPropertyAndLineNumber(property, function( err, value, lineNumber ) {
		if ( err || ! lineNumber ) {
			if ( this._mainSectionStartLine === null ) {
				callback( new Error('Unable to find start of main desktop entry section') );
				return;
			}

			linesCopy.splice(this._mainSectionStartLine + 1, 0, propertyLine);
		} else {
			linesCopy[ lineNumber ] = propertyLine;
		}

		fs.writeFile(this.desktopFilePath, linesCopy.join('\n'), { encoding: 'utf8' }, function ( err ) {
			if ( err ) {
				writeFileAsRoot(
				this.desktopFilePath,
				linesCopy.join('\n'),
				{
					rootExecArgs: ['-m', 'Nde File Manager wants to write to ' + this.desktopFilePath],
					encoding:     'utf8'
				},
				function ( err ) {
					if ( err ) {
						callback( err );
						return;
					}

					// write changes back to object
					this._lines = linesCopy;
					callback( null );
				}.bind(this));
			} else {
				// write changes back to object
				this._lines = linesCopy;
				callback( null );
			}

		}.bind(this));
	}.bind(this));
};

XdgDesktopEntry.prototype.getProperty = function( property, callback ) {
	this.getPropertyAndLineNumber(property, function( err, value, lineNumber ) {
		callback( err, value );
	});
};

XdgDesktopEntry.prototype.getPropertyAndLineNumber = function( property, callback ) {
	var pattern            = new RegExp('^' + property + '\\s*=\\s*'),
	    value              = null,
	    propertyLineNumber = null;

	this.getLines(function( err, lines ) {
		if ( err ) {
			callback( err, value, propertyLineNumber );
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
				this._mainSectionStartLine = i;
				inMainSection = true;
				continue;
			}


			if ( line.match(pattern) ) {
				value = line.replace(pattern, '').trim();
				value = value === '' ? null : value;
				propertyLineNumber = i;
				break;
			}
		}

		callback( null, value, propertyLineNumber );
	}.bind(this));
};

module.exports = XdgDesktopEntry;