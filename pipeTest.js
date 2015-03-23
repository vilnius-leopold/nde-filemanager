var now        = require("performance-now");
var sort       = require('sort-stream');
var fs         = require('fs');
var async      = require('async');
var Readable   = require('stream').Readable;
var File       = require(__dirname + '/file.js');
var FileSorter = require(__dirname + '/FileSorter.js');

// Settings
var pwd            = '/home/leo/',
    sortSettings   = ['directoryFirst', 'fileName'],
    filterSettings = ['hiddenFiles'];


var filterMap = {
	'hiddenFiles': filterHiddenFiles
};

// File vars

var fileCount         = 0,
    filteredFileCount = 0;

function getFilters() {
	var filters = [];

	for ( var filterName in filterMap ) {

		filters.push( filterMap[filterName] );
	}

	return filters;
}


var filters          = getFilters();

var fileSorter = new FileSorter(sortSettings);

fileSorter.onsorted = function( sortedFiles ) {

	var sortedFileNames = sortedFiles.map(function( file ) {
		return file.getCachedFileName();
	});

	console.log('Files:\n', sortedFileNames);
	console.log('Total    files:', fileCount);
	console.log('Filtered files:', filteredFileCount);
	console.log('Benchmark:', now().toFixed(3));
};

// NOTE:
// There is really not difference
// in performance if you
// map / eval / literal
// sort dependencies
// - crazy V8 ... seems like nothing
// makes a difference

function addToPipeWhenReady( file ) {
	// filter files
	file.isHidden(function(err, isHidden) {
		if ( ! isHidden ) {
			filteredFileCount++;
			fileSorter.add(file);
		}
	});
}


function filterHiddenFiles( file ) {
	return ! file.cachedIsHidden();
}

fs.readdir(pwd, function( err, fileList ) {
	var fileName,
	    file,
	    i;

	fileCount = fileList.length;
	// console.log( 'File count', fileCount );

	for ( i = 0; i < fileCount; i++ ) {
		fileName = fileList[i];

		file = new File(fileName, pwd);


			addToPipeWhenReady(file);

	}
});