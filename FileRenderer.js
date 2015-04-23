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


function FileRenderer( document ) {
	var folderIconMappingList = Object.keys(folderIconMapping),
	    iconPathFetcher       = new IconPathFetcher();

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
		// console.log('Rendering shell:', file);

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

			// console.log('Rendered shell:', file.getFileName);
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

		console.log('Command', command);

		var matchedLine = execSync( command ) + '';

		console.log('matchedLine', matchedLine);

		var iconName = matchedLine.replace(/^Icon=\s*/, '').trim();

		if ( matchedLine === '' ) return null;

		return iconName;
	}

	this.renderIcon = function(file, size) {
		size = size || 64;

		file.isDirectory(function(err, isDir) {
			if ( ! isDir ) {
				if ( file instanceof DesktopFile ) {
					console.log('Desktop file:', file);

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
		// console.log( 'Render file:', file);

		if ( ! file || ! file.getFileName ){
			console.log('Faulty File:', file);
			return;
		}

		file.getFileName(function( err, fileName ){
			if ( file instanceof BookmarkFile ) {
				file.getAbsolutePath(function(err, absPath){
					if (absPath === '/home/leo')
						fileName = 'Home';

					file.fileNameElement.textContent = fileName;
				});
			} else if ( file instanceof DesktopFile ) {
				file.getDisplayName(function(err, displayName) {
					file.element.setAttribute( 'name', displayName );
				});
			} else {
				file.element.setAttribute( 'name', fileName );
			}
		});
	};

	this.render = function( file, callback, iconSize ) {
		// console.log('Rendering file:', file);
		var fileElement = this.renderShell(file);
		// console.log('After shell render file:', file);
		// console.log('Rendered file element:', fileElement);
		callback(fileElement);
		// console.log('After callback file:', file);
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