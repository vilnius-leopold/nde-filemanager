var fs    = require('fs'),
    mime  = require('mime'),
    exec = require('child_process').exec;

var historyPosition  = 0,
    historyData      = {},
    history          = [];

var folderIconMappingList = Object.keys(folderIconMapping);

var UI = {
	getLocation: function() {
		return document.querySelector('#location').value;
	},
	setLocation: function( path ) {
		document.querySelector('#location').value = path;
	},
	addFile: function( fileElement, container ) {
		container = container || 'files';

		document.querySelector('#' + container)
		        .appendChild( fileElement );
	},
	addSidebarSection: function( sectionName ) {
		var sectionId = sectionName.toLowerCase().replace(/[^a-z0-9]/g, '-');

		var section = document.createElement('div');
		section.id = sectionId;
		section.className = 'sidebar-section';
		section.innerHTML = '<h3>'+ sectionName + '</h3>';

		document.querySelector('#sidebar')
		        .appendChild( section );

		return sectionId;
	},
	clear: function( container ){
		container = container || 'files';
		document.querySelector('#' + container).innerHTML = '';
	},
	getScrollPosition: function() {
		return document.querySelector('#content').scrollTop;
	},
	setScrollPosition: function(value) {
		document.querySelector('#content').scrollTop = value;
	},
	onLocationChange: function( callback ) {
		document.querySelector('#location')
		.addEventListener('keypress', function( ev ){
			if (ev.keyCode == 13) {
				var location = UI.getLocation();

				if ( location.substr(location.length - 1) != '/' )
					location += '/';


				fs.stat(location, function(err, stats){
					if ( ! err && stats.isDirectory() ) {
						currentDirectory = location;
						callback(currentDirectory);
					} else {
						alert('Directory does not exist');
					}
				});

			}
		});
	},
	onFileClick: function( callback ) {
		document.querySelector('body')
		.addEventListener('click', function( ev ) {
			var target = ev.target,
			    parent = target.parentNode;

			console.log('click');

			if (target.classList.contains('item') )  {
				console.log('click item');
				callback( target );
			}

			if (parent.classList.contains('item') )  {
				console.log('click item');
				callback( parent );
			}
		});
	},
	onPrevClick: function( callback ) {
		document.querySelector('#prev-button')
		.addEventListener('click', function( ev ) {
			callback();
		});
	},
	onNextClick: function( callback ) {
		document.querySelector('#next-button')
		.addEventListener('click', function( ev ) {
			callback();
		});
	},
	showButton:  function( id ) {
		document.querySelector('#' + id).classList.remove('hide');
	},
	hideButton:  function( id ) {
		document.querySelector('#' + id).classList.add('hide');
	},
	onUpClick: function( callback ) {
		document.querySelector('#up-button')
		.addEventListener('click', function( ev ) {
			callback();
		});
	},
	onHideClick: function( callback ) {
		document.querySelector('#hide-button').addEventListener('click', function( ev ) {
			document.querySelector('#files').classList.toggle('hide-hidden');
		});
	}
};


console.log("Test", currentDirectory);


function getIconPath( iconName ) {

	var iconDirectory = '/usr/share/icons/';

	return iconDirectory + iconTheme + '/' + iconName + '.svg';
}

function getMimeTypeIconName( filePath ) {
	var mimeType = mime.lookup( filePath );

	mimeType = mimeType.replace(/\//g, '-');

	return 'mimetypes/48/' + mimeType;
}

function getFileTypeIconPath( file, size ) {
	var iconName = '';

	if ( file.stats.isFile() ) {
		iconName = getMimeTypeIconName( file.fileName );
	} else if ( file.stats.isDirectory() ) {
		var mappedPathIndex = folderIconMappingList.indexOf(file.absolutePath);

		if ( mappedPathIndex === -1 ) {
			iconName = 'places/64/folder'
		} else {
			var mappedPath = folderIconMappingList[mappedPathIndex];
			iconName = folderIconMapping[mappedPath];
		}
	}

	console.log('iconName', iconName);

	if ( size )
		iconName = iconName.replace(/\/\d+\//, '/' + size + '/');

	return getIconPath( iconName );
}

function File( options ) {
	var that = this;

	this.hidden         = false;
	this.stats          = null;
	this.type           = 'file';
	this.absolutePath   = null;
	this.fileName       = null;

	(function init( options ){
		// console.log("Options:", options);

		if ( ! options || ! options.stats )
			return null;

		that.stats  = options.stats;


		if ( that.stats.isDirectory() )
			that.type = 'directory';


		that.fileName     = options.fileName;
		that.absolutePath = options.absolutePath;

		if (that.fileName[0] === '.')
			that.hidden = true;

		// console.log("Filename:", options.fileName);
	}( options ));

	this.render = function( iconPath ) {
		var fileElement = document.createElement('div');

		var iconName = (that.absolutePath === '/home/leo') && iconPath ? 'Home' : that.fileName;

		if ( ! iconPath )
			iconPath = getFileTypeIconPath(this);

		var hiddenClass = '';

		if (that.hidden)
			hiddenClass = ' hidden-item';


		fileElement.className = 'item file' + hiddenClass;
		fileElement.innerHTML = '<img src="'+iconPath+'"><p>' + iconName + '</p>';
		fileElement.obj = that;

		return fileElement;
	};

	this.renderInline = function() {
		var iconPath = getFileTypeIconPath(this, 16);

		console.log('Inline icon:', iconPath);

		var element = this.render(iconPath);

		element.classList.add('inline-item');

		return element;
	};
}

function getFileName( filePath ) {
	if ( filePath == '/' )
		return '/';


	var segments = filePath.split('/');
	console.log('segments', segments);

	if ( filePath.substr(filePath.length - 1) === '/')
		return segments[segments.length - 2];

	return segments[segments.length - 1];
}

function getFile(fileName, callback) {
	// console.log("filePath",filePath);
	var absolutePath = currentDirectory + fileName;

	if ( fileName.substr(0,1) == '/') {
		absolutePath = fileName;
		fileName = getFileName( fileName );
	}
	// console.log("absolutePath",absolutePath);


	fs.stat(absolutePath, function(err,stats) {
		// console.log(err,stats);

		callback(
			err,
			new File({
				stats: stats,
				fileName: fileName,
				absolutePath: absolutePath
			})
		);
	});
}

function openDir( path, resetHistory ) {
	if ( path.substr(path.length - 1) != '/' )
		path += '/';

	// clear history up to this point
	resetHistory = typeof resetHistory === 'undefined' ? true : false;

	if ( resetHistory ){
		console.log('Resetting', history, 0, historyPosition+1);
		history = history.slice(0, historyPosition+1);
		historyPosition = 0;
		console.log('Reset History', history);
	}


	if ( history.indexOf(path) === -1){

		history.unshift( path );
	}

	var scrollTop = UI.getScrollPosition();

	console.log('scrollTop', scrollTop);

	historyData[path] = {
		scrollPosition: scrollTop
	};

	console.log('History', history);
	console.log('historyData', historyData);
	console.log('historyPosition', historyPosition);

	UI.clear('files');
	UI.setLocation( path );
	currentDirectory = path;

	if (currentDirectory === '/home/leo/' || currentDirectory === '/' ) {
		UI.hideButton('up-button');
	} else {
		UI.showButton('up-button');
	}


	if (history.length <= 1) {
		UI.hideButton('next-button');
		UI.hideButton('prev-button');
	} else if ( historyPosition === 0 ) {
		UI.showButton('prev-button');
		UI.hideButton('next-button');
	} else if ( historyPosition === history.length -1 ) {
		UI.showButton('next-button');
		UI.hideButton('prev-button');
	} else {
		UI.showButton('next-button');
		UI.showButton('prev-button');
	}

	fs.readdir( path, function(err,files) {
		"use strict";

		var fileCount = files.length;

		// console.log("err",err);
		// console.log("files",files);
		// console.log("fileCount",fileCount);



		for ( var i = 0; i < fileCount; i++ ) {
			var filePath = files[i];

			getFile(filePath, function( err, file ) {
				if ( err || ! file )
					return;

				UI.addFile( file.render() );
			});
		}
	});
}

function addBookmarks() {
	UI.clear('sidebar');

	var sectionName;

	for ( sectionName in bookmarks ) {
		(function() {
			var sectionId = UI.addSidebarSection(sectionName);
			var sectionItems = bookmarks[sectionName];

			sectionItems.forEach(function( filePath ) {
				console.log('Bookmark', filePath);

				getFile(filePath, function( err, file ) {
					console.log('Bookmark File', err, file);
					if ( err || ! file )
						return;

					UI.addFile( file.renderInline(), sectionId );
				});
			});
		}());
	}
}

function openHistoryDir(position) {
	var historyPath = history[position];

	openDir( historyPath, false);

	console.log('History', historyPath);
	console.log('HistoryData', historyData[historyPath]);

	UI.setScrollPosition(historyData[historyPath].scrollPosition);
}

function openPrevDir(){
	historyPosition = Math.min(historyPosition+1, history.length -1);
	openHistoryDir(historyPosition);
}

String.prototype.reverse = function() {
	return this.split("").reverse().join("");
};

function openParentDir(){
	console.log('currentDirectory:', currentDirectory);
	var segments = currentDirectory.split('/');
	console.log('segments:', segments);
	segments.pop();
	segments.pop();

	var parentDir = (segments.join("/")) + '/';

	console.log('Parent dir:', parentDir);

	openDir(parentDir, false);
}

function openNextDir(){
	historyPosition = Math.max(historyPosition-1, 0);
	openHistoryDir(historyPosition);
}


function init() {
	if ( debug ) {
		require('nw.gui').Window.get().showDevTools();
	}

	currentDirectory = UI.getLocation();


	UI.onLocationChange(function( path ){
		openDir( path );
	});

	UI.onHideClick();

	UI.onNextClick(function(){
		openNextDir();
	});

	UI.onPrevClick(function(){
		openPrevDir();
	});

	UI.onUpClick(function(){
		openParentDir();
	});

	UI.onFileClick(function( element ) {
		var fileObj = element.obj;

		if ( fileObj.type === 'directory' ) {
			openDir( fileObj.absolutePath );
		} else {
			var command = '/usr/bin/xdg-open "' + fileObj.absolutePath + '"';

			console.log('fileObj', fileObj);
			console.log('command', command);

			exec(command);

			// xdgOpen.stdout.on('data', function (data) {
			// 	console.log('stdout: ' + data);
			// });

			// xdgOpen.stderr.on('data', function (data) {
			// 	console.log('stderr: ' + data);
			// });

			// xdgOpen.on('close', function (code) {
			// 	console.log('child process exited with code ' + code);
			// });
		}

		// console.log('Clicked', element);
		// console.log('Clicked', path);
	});

	addBookmarks();

	openDir( currentDirectory );
}


init();