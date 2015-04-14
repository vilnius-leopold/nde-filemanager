var fs              = require('fs'),
    mime            = require('mime'),
    exec            = require('child_process').exec,
    UI              = require('./UI.js'),
    BookmarkFile    = require('./BookmarkFile.js'),
    NdeFs           = require('./NdeFs.js'),
    argParser       = require('optimist'),
    nwGui           = require('nw.gui');

/*
Transition to History object
and NdeFs object
*/

function FileManager() {
	var ui,
	    ndeFs,
	    historyPosition   = 0,
	    files             = [],
	    selectedFileIndex = 0,
	    debug             = false,
	    bookmarkFiles     = [],
	    bookmarkCount     = 0,
	    historyData       = {},
	    history           = [];

	function updateHistory(path) {
		if ( path === history[historyPosition] ) {
			// do nothing
			console.log('Same dir. Do nothing.');
		} else if ( path === history[historyPosition-1] ) {
			// set history to previous point
			historyPosition = historyPosition - 1;
			console.log('Is prev dir. go back in histry.');
		} else if ( path === history[historyPosition+1] ) {
			// set history to next point
			console.log('Is next dir. go forward in histry.');
			historyPosition = historyPosition + 1;
		} else {
			console.log('New dir. Set new head.');
			// add item to history
			// set history to head
			// remove all old history between ( 0 and currentPos )
			if ( historyPosition !== 0 )
				history = history.slice(historyPosition, history.length);

			history.unshift(path);
			historyPosition = 0;
		}
	}

	function renderHistoryButtons() {
		if (ndeFs.currentDirectory === ndeFs.userHome + '/' || ndeFs.currentDirectory === '/' ) {
			ui.hideButton('up-button');
		} else {
			ui.showButton('up-button');
		}


		if (history.length <= 1) {
			ui.hideButton('next-button');
			ui.hideButton('button-separator');
			ui.hideButton('prev-button');
		} else {
			ui.showButton('prev-button');
			ui.showButton('button-separator');
			ui.showButton('next-button');
		}

		if ( historyPosition === 0 ) {
			ui.disableButton('next-button');
			ui.enableButton('prev-button');
		} else if ( historyPosition === history.length -1 ) {
			ui.enableButton('next-button');
			ui.disableButton('prev-button');
		} else {
			ui.enableButton('next-button');
			ui.enableButton('prev-button');
		}
	}

	function markBookmark( path ) {
		var bookmarkFile,
		    i;

		for ( i = 0; i < bookmarkCount; i++ ) {
			bookmarkFile = bookmarkFiles[i];

			bookmarkFile.getAbsolutePath(function(err, absPath) {
				if ( absPath + '/' === path ) {
					bookmarkFile.element.classList.add('selected');
				} else {
					bookmarkFile.element.classList.remove('selected');
				}
			});
		}
	}


	function openPrevDir(){
		var pos = Math.min(historyPosition+1, history.length -1);
		ndeFs.getFilesInDirectory(history[pos]);
	}

	function openNextDir(){
		var pos = Math.max(historyPosition-1, 0);
		ndeFs.getFilesInDirectory(history[pos]);
	}

	function openParentDir() {
		var segments = ndeFs.currentDirectory.split('/');
		segments.pop();
		segments.pop();

		var parentDir = (segments.join("/")) + '/';

		ndeFs.getFilesInDirectory(parentDir, false);
	}

	function addBookmarks( bookmarks ) {
		window.requestAnimationFrame(function(){
			var sectionName;

			ui.clear('sidebar');

			for ( sectionName in bookmarks ) {
				(function() {
					var sectionId = ui.addSidebarSection(sectionName);

					var sectionItems = bookmarks[sectionName];

					sectionItems.forEach(function( absoluteFilePath ) {
						// console.log('Bookmark', filePath);

						var splitIndex = absoluteFilePath.lastIndexOf("/");
						var parentDirectory = absoluteFilePath.substring(0, splitIndex+1);
						var fileName = absoluteFilePath.substring(splitIndex+1);

						if (absoluteFilePath === '/') {
							parentDirectory = '/';
							fileName        = '/';
						}

						var bookmarkFile = new BookmarkFile(fileName, parentDirectory);

						bookmarkFiles.push( bookmarkFile );
						bookmarkCount++;

						ui.addBookmarkFileToSection( bookmarkFile, sectionId );
					}.bind(this));
				}.bind(this)());
			}
		});
	}

	(function init() {
		// init fileSystem
		ndeFs = new NdeFs();

		ndeFs.validPathCallback = function( path ) {
			updateHistory(path);
			ui.setLocation( path );
			renderHistoryButtons();
			markBookmark(path);
		};

		ndeFs.onFiles = function( sortedFiles ) {
			var filteredFileCount = sortedFiles.length;

			window.requestAnimationFrame(function(){

				ui.clear('files');
				files = [];

				for ( var i = 0; i < filteredFileCount; i++ ) {
					var file = sortedFiles[i];
					files.push(file);
					ui.addFile(file);
				}
			});
		};

		// parse CLI flags
		var args = argParser.default({ debug : false })
		.boolean(['debug'])
		.parse(nwGui.App.argv);

		// set settings
		debug            = args.debug;

		var startDir = args._[0] || ndeFs.userHome;

		if ( debug ) {
			nwGui.Window.get().showDevTools();
		}


		// init UI
		ui = new UI(document);

		ui.onLocationChange(function( path ){
			ndeFs.getFilesInDirectory( path );
		});

		ui.onHideClick();

		ui.onNextClick(function(){
			openNextDir();
		});

		ui.onPrevClick(function(){
			openPrevDir();
		});

		ui.onSelectedClick(function(){
			openFile(files[selectedFileIndex]);
		});

		ui.onLocationEscape(function(){
			ui.setLocation(ndeFs.currentDirectory);
		});

		ui.onUpClick(function(){
			openParentDir();
		});

		ui.onFileContextClick(function( element, x, y ) {
			var fileObj = element.obj;

			contextmenuElement.style.top  = y + 'px';
			contextmenuElement.style.left = x + 'px';
			contextmenuElement.classList.toggle('hide');

			// var command = 'rm -r "' + fileObj.absolutePath + '"';

			// console.log('fileObj', fileObj);
			// console.log('command', command);

			// exec(command);
		});

		function openFile( file ) {
			file.isDirectory(function( err, isDir ) {
				file.getAbsolutePath(function(err, absPath) {
					if ( isDir ) {
						ndeFs.getFilesInDirectory( absPath );
					} else {
						var command = '/usr/bin/xdg-open "' + absPath + '"';

						exec(command);
					}
				});
			});
		}

		ui.onFileClick(function(element) {
			openFile( element.obj );
		});

		ui.setView(view);

		addBookmarks( bookmarks );

		ndeFs.getFilesInDirectory( startDir );
		/*
		*/
	}());
}