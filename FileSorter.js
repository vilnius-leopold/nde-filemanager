var async = require('async');

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

	this.fileCount        = 0;

	var sortDependencies = [],
	    sorterCount      = 0,
	    receivedAllFiles = false,
	    sorters          = [],
	    files            = [],
	    readyCount       = 0;
	    noSorters        = false;

	// INIT
	updateSorterSettings();

	// PRIVATE
	function updateSorterSettings() {
		var sortName = '',
		    sortData,
		    i;

		sorterCount = sortSettings.length;
		noSorters   = sorterCount === 0;

		if ( noSorters )
			return;

		for ( i = 0; i < sorterCount; i++ ) {
			sortName = sortSettings[i];
			sortData = sortMap[sortName];

			sortDependencies.push(sortData.dependencies);
			sorters.push(sortData.sorter);
		}
	}

	var sortWhenReady = function () {
		readyCount++;

		// console.log(readyCount);

		if ( receivedAllFiles && readyCount === this.fileCount ) {
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

	// PUBLIC

	// NOTE:
	// There is really not difference
	// in performance if you
	// map / eval / literal
	// sort dependencies
	// - crazy V8 ... seems like nothing
	// makes a difference
	this.add = function( file ) {
		if ( file === null ) {
			receivedAllFiles = true;

			if ( noSorters ) {
				this.onsorted(files);
			}

			return;
		}

		this.fileCount++;


		if ( noSorters ) {
			files.push(file);

			return;
		}

		// prepare sort
		async.parallel(
		sortDependencies.map(function(dep){ return file[dep]; }),
		function( err, isDir ) {
			files.push(file);
			sortWhenReady();
		});
	}.bind(this);
}

module.exports = FileSorter;