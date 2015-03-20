var fs   = require('fs'),
    mime = require('mime');

var currentDirectory = '/home/leo/',
    debug = true,
    historyPosition = 0,
    history = [];


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
	onLocationChange: function( callback ){
		document.querySelector('#location')
		.addEventListener('keypress', function( ev ){
			if (ev.keyCode == 13) {
				currentDirectory = UI.getLocation();
				callback(currentDirectory);
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
	}
};

currentDirectory = UI.getLocation();

console.log("Test", currentDirectory);


function getIconPath( iconName ) {
	var iconTheme = 'Flattr';

	var iconDirectory = '/usr/share/icons/';

	return iconDirectory + iconTheme + '/' + iconName + '.svg';
}

function getMimeTypeIconName( fileName ) {
	var mimeType = mime.lookup( fileName );

	mimeType = mimeType.replace(/\//g, '-');

	return 'mimetypes/48/' + mimeType;
}

function getFileTypeIconPath( file ) {
	var iconName = '';

	if ( file.stats.isFile() ) {
		iconName = getMimeTypeIconName( file.fileName );
	} else if ( file.stats.isDirectory() ) {
		iconName = 'places/64/folder'
	}

	return getIconPath( iconName );
}

function File( options ) {
	var that = this;

	this.hidden = false;
	this.stats  = null;

	(function init( options ){
		// console.log("Options:", options);

		if ( ! options || ! options.stats )
			return null;

		that.stats  = options.stats;

		that.fileName = options.fileName;

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
	if ( resetHistory )
		historyPosition = 0;

	UI.clearFiles();
	UI.setLocation( path );

	if ( history.indexOf(path) === -1)
		history.unshift( path );

	console.log('History', history);

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

function openPrevDir(){
	historyPosition = Math.min(historyPosition+1, history.length -1);

	openDir(history[historyPosition], false);
};

function openNextDir(){
	historyPosition = Math.max(historyPosition-1, 0);

	openDir(history[historyPosition], false);
};


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

	UI.onFileClick(function( element ) {
		var path = UI.getLocation() + element.obj.fileName + '/';


		console.log('Clicked', element);
		console.log('Clicked', path);
		openDir( path );
	});

	openDir( currentDirectory );
}


init();