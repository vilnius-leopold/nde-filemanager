var BookmarkFile    = require('./BookmarkFile.js'),
    DesktopFile     = require('./DesktopFile.js'),
    IconPathFetcher = require('./IconPathFetcher.js'),
    execSync        = require("child_process").execSync;


var folderIconMapping = {
	'/home/leo':           ['places', 'user-home'],
	'/home/leo/Downloads': ['places', 'folder-download'],
	'/home/leo/Videos':    ['places', 'folder-videos'],
	'/home/leo/Documents': ['places', 'folder-documents'],
	'/home/leo/Projects':  ['places', 'folder-templates'],
	'/home/leo/Desktop':   ['places', 'user-desktop'],
	'/media/Share':        ['devices', 'drive-harddisk']
};
var iconTheme     = 'Flattr';
var iconDirectory = '/usr/share/icons/';


function FileRenderer( options ) {
	var document              = options.document,
	    folderIconMappingList = Object.keys(folderIconMapping),
	    iconPathFetcher       = options.iconPathFetcher;

	function getIconPath( category, size, iconName ) {
		return iconDirectory + iconTheme + '/' + category + '/' + size + '/' + (iconName.replace(/\//g, '-')) + '.svg';
	}

	// function mimeTypeToPath( mimeType ) {
	// 	return ;
	// }

	// function getFileTypeIconPath( file, size, callback ) {
	// 	var iconName = '';

	// 	function mimeCallback( iconName ) {
	// 		if ( size )
	// 			iconName = iconName.replace(/\/\d+\//, '/' + size + '/');

	// 		callback( getIconPath( iconName ) );
	// 	}

	// 	file.isDirectory(function( err, isDir ) {
	// 		 if ( isDir ) {
	// 			var mappedPathIndex = folderIconMappingList.indexOf(file.absolutePath);

	// 			if ( mappedPathIndex === -1 ) {
	// 				iconName = 'places/64/folder';
	// 			} else {
	// 				var mappedPath = folderIconMappingList[mappedPathIndex];
	// 				var mapData = folderIconMapping[mappedPath]
	// 				category = mapData[0];
	// 				iconName = mapData[1];
	// 			}

	// 			mimeCallback(iconName);
	// 		} else {
	// 			getMimeTypeIconName( file.fileName, mimeCallback );
	// 		}
	// 	});
	// }


	this.renderShell = function( file ) {
		if ( file instanceof BookmarkFile ) {
			var fileElement     = document.createElement('div');
			fileElement.className = 'item file';

			var iconElement     = new window.Image();
			var fileNameElement = document.createElement('p');
			fileElement.appendChild(iconElement);
			fileElement.appendChild(fileNameElement);

			fileElement.obj      = file;

			file.element         = fileElement;
			file.iconElement     = iconElement;
			file.fileNameElement = fileNameElement;

			return fileElement;
		} else {
			var fileElement = document.createElement('nde-file');

			fileElement.className = 'item file';
			fileElement.obj       = file;
			file.element          = fileElement;

			return fileElement;
		}

	};
var escapeShell = function(cmd) {
  return '"'+cmd.replace(/(["\s'$`\\])/g,'\\$1')+'"';
};
	function getDesktopFileIconName( path ) {
		var command  = 'grep -E ^Icon= ' + path.replace(/(["\s'$`\\])/g,'\\$1');

		var matchedLine = execSync( command ) + '';

		var iconName = matchedLine.replace(/^Icon=\s*/, '').trim();

		if ( matchedLine === '' ) return null;

		return iconName;
	}

	this.renderIcon = function(file, size) {
		size = size || 64;

		file.isDirectory(function(err, isDir) {
			if ( ! isDir ) {
				if ( file instanceof DesktopFile ) {
					file.getIconPath(function( err, iconPath ) {
						if ( err )
							iconPath = '/usr/share/icons/Flattr/mimetypes/48/text-plain.svg';

						file.element.setAttribute('icon', iconPath);
					});
				} else {
					file.getMimeType(function( err, mimeType ){
						if ( mimeType )
							iconPathFetcher.getIconPath( mimeType.replace(/\//g, '-'), 48, function( err, iconPath ) {
								if ( err )
									iconPath = '/usr/share/icons/Flattr/mimetypes/48/text-plain.svg';

								if ( file instanceof BookmarkFile ) {
									file.iconElement.src = iconPath;
								} else {
									file.element.setAttribute('icon', iconPath);
								}
							});
					});
				}//END if Desktop file
			} else {
				file.getAbsolutePath(function( err, absolutePath ) {
					var mappedPathIndex = folderIconMappingList.indexOf(absolutePath),
					    iconName,
					    iconCategory;

					if ( mappedPathIndex === -1 ) {
						iconName = 'folder';
						iconCategory = 'places';
					} else {
						var mappedPath = folderIconMappingList[mappedPathIndex];
						var mapData = folderIconMapping[mappedPath]
						iconCategory = mapData[0];
						iconName     = mapData[1];
					}


					iconPathFetcher.getIconPath( iconName.replace(/\//g, '-'), size, function( err, iconPath ) {
						if ( err )
							iconPath = '/usr/share/icons/Flattr/mimetypes/48/text-plain.svg';

						if ( file instanceof BookmarkFile ) {
							file.iconElement.src = iconPath;
						} else {
							file.element.setAttribute('icon', iconPath);
						}
					});
				});
			}
		});
	};

	this.renderFileName = function(file) {
		file.getDisplayName(function( err, displayName ){
			if ( file instanceof BookmarkFile ) {
				file.fileNameElement.textContent = displayName;
			} else {
				file.element.setAttribute( 'name', displayName );
			}
		});
	};

	this.render = function( file, callback, iconSize ) {
		var fileElement = this.renderShell(file);
		callback(fileElement);
		this.renderFileName(file);
		this.renderIcon(file, iconSize);
	}.bind(this);

	this.renderInline = function( file, callback ) {

		this.render( file, function( element ){
			element.classList.add('inline-item');

			callback(element);
		}, 16);
	}.bind(this);
}

module.exports = FileRenderer;