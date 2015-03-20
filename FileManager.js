var fs    = require('fs'),
    mime  = require('mime'),
    exec = require('child_process').exec;

var currentDirectory = '/home/leo/',
    debug = true,
    historyPosition = 0,
    historyData = {},
    history = [];

var folderIconMapping = {
	'/home/leo/Downloads': 'places/64/folder-download',
	'/home/leo/Videos':    'places/64/folder-videos',
	'/home/leo/Documents': 'places/64/folder-documents',
	'/home/leo/Desktop':   'places/64/user-desktop'
};

var bookmarks = [
	'/home/leo/',
	'/home/leo/Downloads',
	'/home/leo/Videos',
	'/home/leo/Documents',
	'/',
];

var folderIconMappingList = Object.keys(folderIconMapping);

var UI = {
	getLocation: function(){
		return document.querySelector('#location').value;
	},
	setLocation: function( path ){
		document.querySelector('#location').value = path;
	},
	addFile: function( fileElement ){
		document.querySelector('#content')
		        .appendChild( fileElement );
	},
	clearFiles: function( fileElement ){
		document.querySelector('#content').innerHTML = '';
	},
	getScrollPosition: function(){
		return document.querySelector('#content').scrollTop;
	},
	setScrollPosition: function(value){
		document.querySelector('#content').scrollTop = value;
	},
	onLocationChange: function( callback ){
		document.querySelector('#location')
		.addEventListener('keypress', function( ev ){
			if (ev.keyCode == 13) {
				var location = UI.getLocation();

				if ( location.substr(location.length - 1) != '/' ) {
					location += '/';
				}

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
		document.querySelector('#content')
		.addEventListener('click', function( ev ) {
			var target = ev.target,
			    parent = target.parentNode;

			console.log('click');

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
	onUpClick: function( callback ) {
		document.querySelector('#up-button')
		.addEventListener('click', function( ev ) {
			callback();
		});
	}
};

currentDirectory = UI.getLocation();

console.log("Test", currentDirectory);


function getIconPath( iconName ) {
	var iconTheme = 'Flattr';

	var iconDirectory = '/usr/share/icons/';

	return iconDirectory + iconTheme + '/' + iconName + '.svg';
}

function getMimeTypeIconName( filePath ) {
	var mimeType = mime.lookup( filePath );

	mimeType = mimeType.replace(/\//g, '-');

	return 'mimetypes/48/' + mimeType;
}

function getFileTypeIconPath( file ) {
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

	this.render = function() {
		var fileElement = document.createElement('div');

		var iconPath = getFileTypeIconPath(this);

		var hiddenClass = '';

		if (that.hidden)
			hiddenClass = ' hidden-item';

		fileElement.className = 'item file' + hiddenClass;
		fileElement.innerHTML = '<img src="'+iconPath+'"><p>' + that.fileName + '</p>';
		fileElement.obj = that;

		return fileElement;
	};
}


function getFile(filePath, callback) {
	// console.log("filePath",filePath);

	var absolutePath = currentDirectory + filePath;
	// console.log("absolutePath",absolutePath);

	fs.stat(absolutePath, function(err,stats) {
		// console.log(err,stats);

		callback(
			err,
			new File({
				stats: stats,
				fileName: filePath,
				absolutePath: absolutePath
			})
		);
	});
}

function openDir( path, resetHistory ) {
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

	UI.clearFiles();
	UI.setLocation( path );
	currentDirectory = path;


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

	UI.onLocationChange(function( path ){
		openDir( path );
	});

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
			var path = UI.getLocation() + fileObj.fileName + '/';
			openDir( path );
		} else {
			var command = '/usr/bin/xdg-open ' + fileObj.absolutePath;

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

	openDir( currentDirectory );
}


init();