function FileFilter( filterSettings ) {
	var filterMap = {
		'hiddenFiles': filterHiddenFiles
	};

	var filters     = [],
	    filterCount = 0;


	function setFilters() {
		var filterName = '';

		filterSettings.forEach(function( filterName ) {
			filters.push( filterMap[filterName] );
			filterCount++;
		});
	}

	setFilters();

	this.onPass = function(file, callback) {
		var interrupt = false,
		    doneFilters = 0;

		if ( filterCount === 0 )
			callback( file );

		filters.forEach(function( filter ) {
			if ( interrupt ) {
				return false;
			}

			filter(file, function( pass ){
				doneFilters++;

				if ( ! pass ) {
					// stop other filters
					interrupt = true;
				} else if ( doneFilters === filterCount ) {
					callback( file );
				}
			});

			if ( interrupt ) {
				return false;
			}
		});
	};

	function filterHiddenFiles( file, callback ) {
		file.isHidden(function(err, isHidden){
			callback( ! isHidden );
		});
	}
}

module.exports = FileFilter;