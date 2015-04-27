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
		'displayName': {
			dependencies: 'getDisplayName',
			sorter:        sortByDisplayName
		},
		'lastModified': {
			dependencies: 'getLastModified',
			sorter:        sortByLastModified
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

		if ( receivedAllFiles && readyCount >= this.fileCount ) {
			receivedAllFiles = false;
			readyCount = 0;

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

	function sortByDisplayName(fileA, fileB) {
		var displayNameA = fileA.getCachedDisplayName().toLowerCase();
		var displayNameB = fileB.getCachedDisplayName().toLowerCase();

		return displayNameA > displayNameB ? 1 : -1;
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

	function sortByLastModified(fileA, fileB) {
		var lastModA = fileA.getCachedLastModified();
		var lastModB = fileB.getCachedLastModified();

		return lastModB - lastModA;
	}

	// PUBLIC

	// NOTE:
	// There is really not difference
	// in performance if you
	// map / eval / literal
	// sort dependencies
	// - crazy V8 ... seems like nothing
	// makes a difference
	this.done = function() {
		receivedAllFiles = true;

		if ( noSorters ) {
			this.onsorted(files);
			return;
		}

		sortWhenReady();


		return;
	};

	this.add = function( file ) {
		this.fileCount++;


		if ( noSorters ) {
			files.push(file);

			return;
		}

		// prepare sort
		async.parallel(
		sortDependencies.map(function(dep){ return file[dep].bind(file); }),
		function( err, isDir ) {
			files.push(file);
			sortWhenReady();
		});
	}.bind(this);

	this.reset = function() {
		receivedAllFiles = false;
		this.fileCount = 0;
		readyCount = 0;
		files = [];
	}.bind(this);
}

module.exports = FileSorter;