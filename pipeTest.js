var now      = require("performance-now");
var sort     = require('sort-stream');
var fs       = require('fs');
var async    = require('async');
var Readable = require('stream').Readable;
var File     = require(__dirname + '/file.js');

// Settings
var pwd            = '/home/leo/p',
    sortSettings   = ['directoryFirst', 'fileName'],
    filterSettings = ['hiddenFiles'];

// map sort fields
// with required file method calls
var sortMap = {
	'directoryFirst': {
		dependencies: 'isDirectory',
		sorter:        sortByDirectoryFirst
	},
	'fileName': {
		dependencies: 'getFileName',
		sorter:        sortByFileName
	},
	'mimeType': {
		dependencies: 'getMimeType',
		sorter:        sortByMimeType
	}
};

var filterMap = {
	'hiddenFiles': filterHiddenFiles
};

// File vars
var files           = [],
    readyCount      = 0,
    fileCount       = 0,
    postFilterCount = 0;

// Sort vars
var sortDependencies = [],
    sorterCount      = 0,
    sorters          = [];

function updateSorterSettings() {
	sortSettings.forEach(function(sortName){
		var sortData = sortMap[sortName];

		sorterCount++;

		sortDependencies.push(sortData.dependencies);
		sorters.push(sortData.sorter);
	});
}

function getFilters() {
	var filters = [];

	for ( var filterName in filterMap ) {

		filters.push( filterMap[filterName] );
	}

	return filters;
}

updateSorterSettings();

var filters          = getFilters();

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

		// console.log( 'isHidden', isHidden );

		if ( true || ! isHidden ) {

			postFilterCount++;

			// prepare sort
			async.parallel(
			// eval(sortArrayString),
			sortDependencies.map(function(dep){ return file[dep]; }),
			// [ file.isDirectory, file.getFileName, file.getMimeType ],
			function( err, isDir ) {
				files.push(file);
				sortWhenReady();
			});
		}
	});
}

function sortWhenReady() {
	readyCount++;

	// console.log(readyCount);

	if ( readyCount === postFilterCount ) {
		var sortedFiles = files
		.sort(sortBySettings);

		var sortedFileNames = sortedFiles.map(function( file ) {
			return file.getCachedFileName();
		});

		console.log('Files:\n', sortedFileNames);
		console.log('Total    files:', fileCount);
		console.log('Filtered files:', postFilterCount);
		console.log('Benchmark:', now().toFixed(3));
	}
}

function filterHiddenFiles( file ) {
	return ! file.cachedIsHidden();
}

function sortBySettings( fileA, fileB ) {
	var sortResult = 0;

	for ( var i = 0; i < sorterCount; i++ ) {
		sortResult = sorters[i](fileA, fileB);

		if ( sortResult !== 0)
			break;
	}

	return sortResult;
}

function sortByDirectoryFirst( fileA, fileB ) {
	var isDirA = fileA.cachedIsDirectory();
	var isDirB = fileB.cachedIsDirectory();

	if ( isDirA === isDirB )
		return 0;
	if ( isDirA === true ) {
		return -1;
	} else {
		return 1;
	}
}

function sortByFileName(fileA, fileB) {
	var fileNameA = fileA.getCachedFileName().toLowerCase();
	var fileNameB = fileB.getCachedFileName().toLowerCase();

	return fileNameA > fileNameB ? 1 : -1;
}

function sortByMimeType(fileA, fileB) {
	var mimeTypeA = fileA.getCachedMimeType();
	var mimeTypeB = fileB.getCachedMimeType();

	if ( mimeTypeA === mimeTypeB )
		return 0;
	if ( mimeTypeA === true ) {
		return -1;
	} else {
		return 1;
	}
}

function sortByDirAndName(fileA, fileB) {
	var isDirA = fileA.cachedIsDirectory();
	var isDirB = fileB.cachedIsDirectory();

	var fileNameA = fileA.getCachedFileName().toLowerCase();
	var fileNameB = fileB.getCachedFileName().toLowerCase();

	// sort by mimetype
	// var fileNameA = fileA.getCachedMimeType();
	// var fileNameB = fileB.getCachedMimeType();

	var fileNameGreater = fileNameA > fileNameB;

	if ( isDirA === isDirB )
		return fileNameGreater ? 1 : -1;
	if ( isDirA === true ) {
		return -1;
	} else {
		return 1;
	}
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


// rs.pipe(sort(function (a, b) {
// 	//comparator function, return 1, 0, or -1
// 	//just like Array.sort
// })).pipe(function(data){
// 	console.log(data);
// });