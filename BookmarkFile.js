var File = require('./File.js');

function BookmarkFile( options ) {
	File.call( this, options );
}

BookmarkFile.prototype = Object.create(File.prototype);

module.exports = BookmarkFile;
