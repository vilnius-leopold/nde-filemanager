var File = require('./File.js');

function BookmarkFile(fileName, parentDirectory) {
	File.call(this, fileName, parentDirectory);
}

BookmarkFile.prototype = Object.create(File.prototype);

module.exports = BookmarkFile;
