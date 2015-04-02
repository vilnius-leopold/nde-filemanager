var fs           = require('fs'),
    mime         = require('mime'),
    exec         = require('child_process').exec,
    UI           = require('./UI.js'),
    File         = require('./File.js'),
    BookmarkFile = require('./BookmarkFile.js'),
    FileSorter   = require('./FileSorter.js'),
    FileFilter   = require('./FileFilter.js'),
    argParser    = require('optimist'),
    nwGui        = require('nw.gui');

function FileManager() {
	var ui,
	    historyPosition   = 0,
	    currentDirectory  = null,
	    userHome          = process.env.HOME,
	    defaultStartDir   = userHome,
	    files             = [],
	    selectedFileIndex = 0,
	    debug             = false,
	    bookmarkFiles     = [],
	    bookmarkCount     = 0,
	    historyData       = {},
	    history           = [];

	var sortSettings   = ['directoryFirst', 'fileName'],
	    filterSettings = ['hiddenFiles'];

	var fileSorter = new FileSorter( sortSettings ),
	    fileFilter = new FileFilter( filterSettings );

	function updateHistory(path) {

		if ( path === currentDirectory ) {
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

		console.log('History:        ', history);
		console.log('historyPosition:', historyPosition);


		// resetHistory = typeof resetHistory === 'undefined' ? true : false;

		// if ( resetHistory ){
		// 	// console.log('Resetting', history, 0, historyPosition+1);
		// 	history = history.slice(0, historyPosition+1);
		// 	historyPosition = 0;
		// 	// console.log('Reset History', history);
		// }


		// if ( history.indexOf(path) === -1){

		// 	history.unshift( path );
		// }

		// var scrollTop = ui.getScrollPosition();

		// // console.log('scrollTop', scrollTop);

		// historyData[path] = {
		// 	scrollPosition: scrollTop
		// };

		// console.log('History', history);
		// console.log('historyData', historyData);
		// console.log('historyPosition', historyPosition);


	}

	function renderHistoryButtons() {
		if (currentDirectory === '/home/leo/' || currentDirectory === '/' ) {
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

	function openDir( path, resetHistory ) {
		path = path.trim();

		if ( path.substr(path.length - 1) != '/' )
			path += '/';

		// preform bash expansion
		// var matches = path.replace(/(\$HOME)/g, function(envVar){
		// 	var envVarValue = process.env[envVar.replace(/^\$/,'')];
		// 	console.log('Found var:', envVar, envVarValue);

		// 	return '~';
		// });

		var expansionFailed = false;

		path = path.replace(/(\$[A-Z_]+)/g, function(envVar){
			console.log('Found var:', envVar);
			var envVarValue = process.env[envVar.replace(/^\$/,'')];

			if ( ! envVarValue ) {
				alert('Unkown environment variable\n' + envVar);
				expansionFailed = true;
			}

			return envVarValue;
		});

		if ( expansionFailed )
			return;

		path = path.replace(/^~/, userHome);


		fs.readdir( path, function(err, fileList) {
			var fileCount,
			    fileName,
			    file,
			    i;

			if ( err ){
				alert('Can not open directory\n' + path + '\n' + err);
				return;
			}

			updateHistory(path);
			ui.setLocation( path );
			currentDirectory = path;
			renderHistoryButtons();
			markBookmark(path);

			fileCount = fileList.length;

			fileSorter.reset();

			fileSorter.onsorted = function( sortedFiles ) {
				console.log('Files sorted!');

				var filteredFileCount = fileSorter.fileCount;

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

			for ( i = 0; i < fileCount; i++ ) {
				fileName = fileList[i];

				file = new File(fileName, currentDirectory);

				fileFilter.onPass(file, fileSorter.add);
			}

			// close file sorter
			fileSorter.add( null );
		});
	}

	function openHistoryDir(position) {
		var historyPath = history[position];

		openDir( historyPath, false);

		// console.log('History', historyPath);
		// console.log('HistoryData', historyData[historyPath]);

		// ui.setScrollPosition(historyData[historyPath].scrollPosition);
	}

	function openPrevDir(){
		var pos = Math.min(historyPosition+1, history.length -1);
		openHistoryDir(pos);
	}

	function openNextDir(){
		var pos = Math.max(historyPosition-1, 0);
		console.log('Open NEXT', pos);
		openHistoryDir(pos);
	}

	function openParentDir(){
		// console.log('currentDirectory:', currentDirectory);
		var segments = currentDirectory.split('/');
		// console.log('segments:', segments);
		segments.pop();
		segments.pop();

		var parentDir = (segments.join("/")) + '/';

		// console.log('Parent dir:', parentDir);

		openDir(parentDir, false);
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
		// parse CLI flags
		var args = argParser.default({ debug : false })
		.boolean(['debug'])
		.parse(nwGui.App.argv);

		// set settings
		debug            = args.debug;
		currentDirectory = args._[0] || defaultStartDir;

		if ( debug ) {
			nwGui.Window.get().showDevTools();
		}

		// init UI
		ui = new UI(document);

		ui.onLocationChange(function( path ){
			openDir( path );
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
			ui.setLocation(currentDirectory);
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
						openDir( absPath );
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

		openDir( currentDirectory );
		/*
		*/
	}());
}