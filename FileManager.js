var fs         = require('fs'),
    mime       = require('mime'),
    exec       = require('child_process').exec,
    UI         = require('./UI.js'),
    File       = require('./File.js'),
    FileSorter = require('./FileSorter.js'),
    FileFilter = require('./FileFilter.js'),
    argParser  = require('optimist'),
    nwGui      = require('nw.gui');

function FileManager() {
	var ui,
	    historyPosition   = 0,
	    currentDirectory  = null,
	    defaultStartDir   = '/home/leo',
	    files             = [],
	    selectedFileIndex = 0,
	    debug             = false,
	    bookmarkFiles     = [],
	    historyData       = {},
	    history           = [];

	var sortSettings   = ['directoryFirst', 'fileName'],
	    filterSettings = ['hiddenFiles'];

	var fileSorter = new FileSorter( sortSettings ),
	    fileFilter = new FileFilter( filterSettings );

	function updateHistory(path) {
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

		var scrollTop = ui.getScrollPosition();

		// console.log('scrollTop', scrollTop);

		historyData[path] = {
			scrollPosition: scrollTop
		};

		// console.log('History', history);
		// console.log('historyData', historyData);
		// console.log('historyPosition', historyPosition);

		ui.setLocation( path );
		currentDirectory = path;

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

	function openDir( path, resetHistory ) {
		if ( path.substr(path.length - 1) != '/' )
			path += '/';


		fs.readdir( path, function(err, fileList) {
			var fileCount,
			    fileName,
			    file,
			    i;

			if ( err )
				throw err;

			updateHistory(path);

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

		console.log('History', historyPath);
		console.log('HistoryData', historyData[historyPath]);

		ui.setScrollPosition(historyData[historyPath].scrollPosition);
	}

	function openPrevDir(){
		historyPosition = Math.min(historyPosition+1, history.length -1);
		openHistoryDir(historyPosition);
	}

	function openNextDir(){
		historyPosition = Math.max(historyPosition-1, 0);
		openHistoryDir(historyPosition);
	}

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

						var file = new File(fileName, parentDirectory);

						bookmarkFiles.push( file );

						ui.addBookmarkFileToSection( file, sectionId );
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