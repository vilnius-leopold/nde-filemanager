var async      = require('async');

function FileSorter( sortSettings ) {
	// map sort fields
	// with required file method calls
	// and sort function
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

	var fileCount        = 0, // number of files added to sorter
	    sortDependencies = [],
	    sorterCount      = 0,
	    sorters          = [],
	    files           = [],
	    readyCount      = 0;

	// INIT
	updateSorterSettings();

	// PRIVATE
	function updateSorterSettings() {
		sortSettings.forEach(function(sortName){
			var sortData = sortMap[sortName];

			sorterCount++;

			sortDependencies.push(sortData.dependencies);
			sorters.push(sortData.sorter);
		});
	}

	var sortWhenReady = function () {
		readyCount++;

		// console.log(readyCount);

		if ( readyCount === fileCount ) {
			var sortedFiles = files
			.sort(sortBySettings);

			if ( this.onsorted )
				this.onsorted( sortedFiles );

		}
	}.bind(this);

	// Sorter functions
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


	// PUBLIC
	this.add = function( file ) {
		fileCount++;

		// prepare sort
		async.parallel(
		sortDependencies.map(function(dep){ return file[dep]; }),
		function( err, isDir ) {
			files.push(file);
			sortWhenReady();
		});
	};


}

module.exports = FileSorter;