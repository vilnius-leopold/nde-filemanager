var now        = require("performance-now");
var sort       = require('sort-stream');
var fs         = require('fs');
var async      = require('async');
var Readable   = require('stream').Readable;
var File       = require(__dirname + '/file.js');
var FileSorter = require(__dirname + '/FileSorter.js');
var FileFilter = require(__dirname + '/FileFilter.js');

// Settings
var pwd            = '/home/leo/',
    sortSettings   = ['directoryFirst', 'fileName'],
    filterSettings = ['hiddenFiles'];


var fileCount         = 0,
    filteredFileCount = 0;

var fileSorter = new FileSorter( sortSettings );
var fileFilter = new FileFilter( filterSettings );

fileSorter.onsorted = function( sortedFiles ) {

	var sortedFileNames = sortedFiles.map(function( file ) {
		return file.getCachedFileName();
	});

	console.log('Files:\n', sortedFileNames);
	console.log('Total    files:', fileCount);
	console.log('Filtered files:', filteredFileCount);
	console.log('Benchmark:', now().toFixed(3));
};

// function filterCallback( file ) {
// 	filteredFileCount++;
// 	(file);
// }

fs.readdir(pwd, function( err, fileList ) {
	var fileName,
	    file,
	    i;

	fileCount = fileList.length;

	for ( i = 0; i < fileCount; i++ ) {
		fileName = fileList[i];

		file = new File(fileName, pwd);

		fileFilter.onPass(file, fileSorter.add);
	}

	// close file sorter
	fileSorter.add( null );
});