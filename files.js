getFileList(createFileObjects);

var filterHidden = true,
    sortSettings   = ['directoryFirst', 'fileName'],
    filterSettings = {
    	byFileName:['hiddenFiles']
    };

function preprocessFileList() {
	// group
	// ==> sort

	// filter
	// --> by file name
	// --> hidden files

	// sort
	// --> by file name
}

var fileIndex = [],
    files     = [],
    fileCount = 0;

function createFileObjects( fileList ) {
	var totalFileCount = fileList.length,
	    fileName,
	    file,
	    isFiltered = false,
	    i;

	var prefilters = filterSettings.byFileName;
	var prefilterCount = 0;

	// check prefilter settings
	if ( prefilters ) {
		prefilterCount = prefilters.length;

		prefilters.map(function(filterName) {
			return filters.byFileName[filterName];
		});
	}

	for (i = 0; i < totalFileCount; i++ ) {
		fileName = fileList[i];

		// prefilter file list
		if ( prefilterCount ) {
			isFiltered = false;

			for ( var p = 0; p < prefilterCount; p++ ) {
				if ( prefilters[p](fileName) ) {
					isFiltered = true;
					break;
				}
			}

			if ( isFiltered )
				continue;
		}

		// create File objects
		file = new File( fileName );

		// get sortStats
		file.getStats('type'); // isDir

		fileIndex.push( fileName);
		files.push( file );

		fileCount++;
	}

	waitForFilterStats( function(){
		filterFiles(function(){
			waitForSortStats( sortFiles );
		});
	});
}

function waitForSortStats( callback ) {
	callback();
}

function preSortFiles() {

}

function preFilterFiles() {

}

function filterFiles() {

}

function sortFiles() {
	files = files.sort( directoryFirst );

	renderFiles();
}

// Differanciate
// render priorities
// visible files <--> invisible files
function renderFiles() {
	onPriorityRenderDone(renderRest);

	for ( var i = 0; i < fileCount; i++ ) {
		var fileElement = file.render();

		UI.addFile(fileElement);

		// if visible, render
		if ( ! stopInflationPriority )
			file.inflateRender();

		// check if file is still visible
		// if not don't render it completely
		if ( i >= 10 && (i % 10) === 0 && ! fileElement.inView() )
			stopInflationPriority = true;

	}

}


var sorters = {
	directoryFirst: function(fileA, fileB) {
		var isDirA = fileA.isDirectory,
		    isDirB = fileB.isDirectory;

		if ( isDirA === isDirB ) {
			return 0;
		} else if ( isDirA ) {
			return 1;
		} else {
			return -1;
		}
	}
};

var filters = {
	byFileName: {
		hidden: function( fileName ){
			return !! fileName.match(/^\./);
		}
	}

};