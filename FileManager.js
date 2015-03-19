var fs = require('fs');

var currentDirectory = '/home/leo/';

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
	}
};

currentDirectory = UI.getLocation();

console.log("Test", currentDirectory);


function File( options ) {
	var that = this;

	this.hidden = false;

	(function init( options ){
		console.log("Options:", options);

		if ( ! options || ! options.stats )
			return null;

		that.fileName = options.fileName;

		if (that.fileName[0] === '.')
			that.hidden = true;

		console.log("Filename:", options.fileName);
	}( options ));

	this.render = function() {
		var fileElement = document.createElement('div');


		var hiddenClass = '';

		if (that.hidden)
			hiddenClass = ' hidden-item';

		fileElement.className = 'item file' + hiddenClass;
		fileElement.innerHTML = '<img src="file.svg"><p>' + that.fileName + '</p>';

		return fileElement;
	};
}


function getFile(filePath, callback) {
	console.log("filePath",filePath);

	var absolutePath = currentDirectory + filePath;
	console.log("absolutePath",absolutePath);

	fs.stat(absolutePath, function(err,stats) {
		console.log(err,stats);

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

function openDir( path ) {
	UI.clearFiles();

	fs.readdir( path, function(err,files) {
		"use strict";

		var fileCount = files.length;

		console.log("err",err);
		console.log("files",files);
		console.log("fileCount",fileCount);



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

UI.onLocationChange(function( path ){
	openDir( path );
});

openDir( currentDirectory );