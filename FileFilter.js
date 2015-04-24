var async = require('async');

function FileFilter( filterSettings ) {
	var filterMap = {
		'hiddenFiles': testHiddenFiles
	};

	var filters     = [],
	    filterCount = 0,
	    noFilters   = false;

	function setFilters() {
		var filterName = '',
		    i;

		filterCount = filterSettings.length;

		noFilters = filterCount === 0;

		if ( noFilters )
			return;

		for ( i = 0; i < filterCount; i++ ) {
			filterName = filterSettings[i];

			filters.push( filterMap[filterName] );
		}
	}

	setFilters();

	this.onPass = function(file, passCallback, failCallback) {
		var interrupt = false,
		    filter,
		    i;

		async.parallel(
			filters.map(function(f){return f.bind(file);}),
			function( err, results) {
				if ( ! err ) {
					passCallback( file );
				} else {
					failCallback( file );
				}
			}
		);
	};

	// FIXME:
	// breaks app with truely async (isHidden) function
	// (e.g. for DesktopFile.isHidden)
	// needs to be fixed!
	function testHiddenFiles( callback ) {
		this.isHidden(function(err, isHidden) {
			if ( ! err && isHidden ) {
				callback(true, false);
			} else {
				callback(null, true);
			}
		});
	}
}

module.exports = FileFilter;