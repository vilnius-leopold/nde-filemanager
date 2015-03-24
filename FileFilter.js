function FileFilter( filterSettings ) {
	var filterMap = {
		'hiddenFiles': filterHiddenFiles
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

	function filterCallback( pass, file, isLast, callback ){
		if ( ! pass ) {
			// stop other filters
			interrupt = true;
		} else if ( isLast ) {
			callback( file );
		}
	}

	this.onPass = function(file, callback) {
		var interrupt = false,
		    filter,
		    i;

		if ( noFilters ) {
			callback( file );
			return;
		}

		for ( i = 0; i < filterCount; i++ ) {
			filter = filters[i];

			if ( interrupt ) {
				return false;
			}

			filter(file, filterCallback, i === filterCount - 1, callback );

			if ( interrupt ) {
				return false;
			}
		}
	};

	function filterHiddenFiles( file, callback, isLast, finalCallback ) {
		file.isHidden(function(err, isHidden){
			callback( ! isHidden, file, isLast, finalCallback );
		});
	}
}

module.exports = FileFilter;