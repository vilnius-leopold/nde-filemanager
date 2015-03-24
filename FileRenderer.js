
var folderIconMapping = {
	'/home/leo':           'places/64/user-home',
	'/home/leo/Downloads': 'places/64/folder-download',
	'/home/leo/Videos':    'places/64/folder-videos',
	'/home/leo/Documents': 'places/64/folder-documents',
	'/home/leo/Projects':  'places/64/folder-templates',
	'/home/leo/Desktop':   'places/64/user-desktop',
	'/media/Share':        'devices/64/drive-harddisk'
};
var iconTheme        = 'Flattr';


function FileRenderer( document ) {
	var folderIconMappingList = Object.keys(folderIconMapping);

	function getIconPath( iconName ) {

		var iconDirectory = '/usr/share/icons/';

		return iconDirectory + iconTheme + '/' + iconName + '.svg';
	}

	function mimeTypeToPath( mimeType ) {
		return 'mimetypes/48/' + mimeType.replace(/\//g, '-');
	}

	function getFileTypeIconPath( file, size, callback ) {
		var iconName = '';

		function mimeCallback( iconName ) {
			if ( size )
				iconName = iconName.replace(/\/\d+\//, '/' + size + '/');

			callback( getIconPath( iconName ) );
		}

		file.isDirectory(function( err, isDir ) {
			 if ( isDir ) {
				var mappedPathIndex = folderIconMappingList.indexOf(file.absolutePath);

				if ( mappedPathIndex === -1 ) {
					iconName = 'places/64/folder';
				} else {
					var mappedPath = folderIconMappingList[mappedPathIndex];
					iconName = folderIconMapping[mappedPath];
				}

				mimeCallback(iconName);
			} else {
				getMimeTypeIconName( file.fileName, mimeCallback );
			}
		});
	}


	this.renderShell = function( file ) {
		// console.log('Rendering shell:', file);

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
	};

	this.renderIcon = function(file, iconPath) {
		if ( ! iconPath ){
			getFileTypeIconPath(that, undefined, iconCallback);
		} else {
			iconCallback( iconPath );
		}

		function iconCallback( iconPath ) {
			var iconName = (that.absolutePath === '/home/leo') && iconPath ? 'Home' : that.fileName;
			file.iconElement.src = iconPath;
			// callback( fileElement );
		}

	};

	this.renderFileName = function(file) {
		// console.log( 'Render file:', file);

		if ( ! file || ! file.getFileName ){
			console.log('Faulty File:', file);
			return;
		}

		file.getFileName(function( err, fileName ){
			// console.log( 'Render name:', fileName);
			if ( ! err )
				file.fileNameElement.textContent = fileName;
		});
	};

	this.render = function( file, callback, iconPath ) {
		// console.log('Rendering file:', file);
		var fileElement = this.renderShell(file);
		// console.log('After shell render file:', file);
		// console.log('Rendered file element:', fileElement);
		callback(fileElement);
		// console.log('After callback file:', file);
		this.renderFileName(file);
		// this.renderIcon(file, iconPath);
	}.bind(this);

	this.renderInline = function( file, callback ) {
		getFileTypeIconPath(file, 16, function( iconPath ){

			// console.log('Inline icon:', iconPath);

			this.render( file, function( element ){
				element.classList.add('inline-item');

				callback(element);
			}, iconPath);
		}.bind(this));
	}.bind(this);
}

module.exports = FileRenderer;