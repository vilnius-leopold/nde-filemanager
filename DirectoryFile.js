var File = require('./File.js');

function DirectoryFile( options ) {
	File.call( this, options );

	this._isDirectory = true;
}

DirectoryFile.prototype = Object.create(File.prototype);

module.exports = DirectoryFile;