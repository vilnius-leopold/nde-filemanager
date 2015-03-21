var fs    = require('fs'),
    mime  = require('mime'),
    exec = require('child_process').exec,
    nwGui = require('nw.gui');

var historyPosition  = 0,
    debug            = false,
    historyData      = {},
    history          = [];

var folderIconMappingList = Object.keys(folderIconMapping);

var contentElement  = document.querySelector('#content');
var menuElement     = document.querySelector('#menu-bar');
var sidebarElement  = document.querySelector('#sidebar');
var filesElement    = document.querySelector('#files');
var locationElement = document.querySelector('#location');
var actionElement   = document.querySelector('#actions');

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

		if (sectionName === '')
			sectionId = 'hidden-section';

		var section = document.createElement('div');
		section.id = sectionId;
		section.className = 'sidebar-section';

		if (sectionId !== 'hidden-section')
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
	onFileContextClick: function( callback ) {
		document.querySelector('body')
		.addEventListener('contextmenu', function( ev ) {
			var target = ev.target,
			    parent = target.parentNode;

			console.log('click');

			if (target.classList.contains('item') )  {
				console.log('click item');
				callback( target, ev.clientX, ev.clientY );
			}

			if (parent.classList.contains('item') )  {
				console.log('click item');
				callback( parent, ev.clientX, ev.clientY );
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
	disableButton:  function( id ) {
		document.querySelector('#' + id).classList.add('disabled');
	},
	enableButton:  function( id ) {
		document.querySelector('#' + id).classList.remove('disabled');
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

function updateLayout() {
	window.requestAnimationFrame(function(){
		console.log('Resizing');

		var width  = window.innerWidth,
		    height = window.innerHeight;



		var menuHeight   = menuElement.offsetHeight;
		var sidebarWidth = sidebarElement.offsetWidth;
		var actionWidth  = actionElement.offsetWidth;

		console.log(width,height,menuHeight,sidebarWidth);

		filesElement.style.width = (width - sidebarWidth - actionWidth) + 'px';
		contentElement.style.width = (width - sidebarWidth) + 'px';
		locationElement.style.width = (width - sidebarWidth + 25 ) + 'px';
		contentElement.style.height = (height - menuHeight) + 'px';
		sidebarElement.style.height = (height - menuHeight) + 'px';
	});
}

window.onresize = updateLayout;

function getIconPath( iconName ) {

	var iconDirectory = '/usr/share/icons/';

	return iconDirectory + iconTheme + '/' + iconName + '.svg';
}

function getMimeTypeIconName( filePath, callback ) {
	var command = 'xdg-mime query filetype "' + currentDirectory + filePath + '"';

	exec(command, function(error, stdout, stderr){
		console.log('Mime:', error, stdout, stderr, command);

		var mimeType = stdout.replace(/\//g, '-');

		callback( 'mimetypes/48/' + mimeType );
	});
}

function getFileTypeIconPath( file, size, callback ) {
	var iconName = '';

	function mimeCallback( iconName ) {
		if ( size )
			iconName = iconName.replace(/\/\d+\//, '/' + size + '/');

		callback( getIconPath( iconName ) );
	}

	if ( file.stats.isFile() ) {
		getMimeTypeIconName( file.fileName, mimeCallback );
	} else if ( file.stats.isDirectory() ) {
		var mappedPathIndex = folderIconMappingList.indexOf(file.absolutePath);

		if ( mappedPathIndex === -1 ) {
			iconName = 'places/64/folder'
		} else {
			var mappedPath = folderIconMappingList[mappedPathIndex];
			iconName = folderIconMapping[mappedPath];
		}

		mimeCallback(iconName);
	} else {
		mimeCallback(iconName);
	}
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

	this.render = function( callback, iconPath ) {
		var fileElement = document.createElement('div');

		var iconName = (that.absolutePath === '/home/leo') && iconPath ? 'Home' : that.fileName;

		function iconCallback( iconPath ) {
			var hiddenClass = '';

			if (that.hidden)
				hiddenClass = ' hidden-item';


			fileElement.className = 'item file' + hiddenClass;
			fileElement.innerHTML = '<img src="'+iconPath+'"><p>' + iconName + '</p>';
			fileElement.obj = that;

			callback( fileElement );
		}

		if ( ! iconPath ){
			getFileTypeIconPath(that, undefined, iconCallback);
		} else {
			iconCallback( iconPath );
		}


	};

	this.renderInline = function( callback ) {
		getFileTypeIconPath(this, 16, function( iconPath ){

			// console.log('Inline icon:', iconPath);

			that.render( function( element ){
				element.classList.add('inline-item');

				callback(element);
			}, iconPath);
		});
	};
}

function getFileName( filePath ) {
	if ( filePath == '/' )
		return '/';


	var segments = filePath.split('/');
	// console.log('segments', segments);

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
		// console.log('Resetting', history, 0, historyPosition+1);
		history = history.slice(0, historyPosition+1);
		historyPosition = 0;
		// console.log('Reset History', history);
	}


	if ( history.indexOf(path) === -1){

		history.unshift( path );
	}

	var scrollTop = UI.getScrollPosition();

	// console.log('scrollTop', scrollTop);

	historyData[path] = {
		scrollPosition: scrollTop
	};

	// console.log('History', history);
	// console.log('historyData', historyData);
	// console.log('historyPosition', historyPosition);

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
		UI.hideButton('button-separator');
		UI.hideButton('prev-button');
	} else {
		UI.showButton('prev-button');
		UI.showButton('button-separator');
		UI.showButton('next-button');
	}

	if ( historyPosition === 0 ) {
		UI.disableButton('next-button');
		UI.enableButton('prev-button');
	} else if ( historyPosition === history.length -1 ) {
		UI.enableButton('next-button');
		UI.disableButton('prev-button');
	} else {
		UI.enableButton('next-button');
		UI.enableButton('prev-button');
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

				file.render(function( fileElement ){
					UI.addFile( fileElement );
				});
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
				// console.log('Bookmark', filePath);

				getFile(filePath, function( err, file ) {
					// console.log('Bookmark File', err, file);
					if ( err || ! file )
						return;

					file.renderInline(function( fileElement ) {
						UI.addFile( fileElement, sectionId );
					});
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

	// parse args
	var args = require('optimist')
	.default({ debug : false })
	.boolean(['debug'])
	.parse(nwGui.App.argv);

	// set settings
	debug = args.debug;
	currentDirectory = args._[0] || currentDirectory;

	if ( debug ) {
		require('nw.gui').Window.get().showDevTools();
	}

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

	UI.onFileContextClick(function( element, x, y ) {
		var fileObj = element.obj;

		document.querySelector('.context-menu').style.top  = y + 'px';
		document.querySelector('.context-menu').style.left = x + 'px';
		document.querySelector('.context-menu').classList.toggle('hide');

		// var command = 'rm -r "' + fileObj.absolutePath + '"';

		// console.log('fileObj', fileObj);
		// console.log('command', command);

		// exec(command);
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
		}
	});

	updateLayout();

	addBookmarks();

	openDir( currentDirectory );
}

window.requestAnimationFrame(function(){
	init();
});