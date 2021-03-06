var fs              = require('fs'),
    UI              = require('./UI.js'),
    BookmarkFile    = require('./BookmarkFile.js'),
    IconPathFetcher = require('./IconPathFetcher.js'),
    NdeFs           = require('./NdeFs.js'),
    NdeHistory      = require('./NdeHistory.js'),
    argParser       = require('optimist'),
    nwGui           = require('nw.gui');

function FileManager() {
	var ui,
	    ndeFs,
	    ndeHistory,
	    iconPathFetcher,
	    debug             = false,
	    bookmarkFiles     = [],
	    bookmarkCount     = 0;

	function renderUpButton() {
		if (ndeFs.currentDirectory === ndeFs.userHome + '/' || ndeFs.currentDirectory === '/' ) {
			ui.hideButton('up-button');
		} else {
			ui.showButton('up-button');
		}
	}

	function renderHistoryButtons() {
		if ( ndeHistory.hasHistory() ) {
			ui.showButton('prev-button');
			ui.showButton('button-separator');
			ui.showButton('next-button');

			if ( ndeHistory.hasNext() ) {
				ui.enableButton('next-button');
			} else {
				ui.disableButton('next-button');
			}

			if ( ndeHistory.hasPrevious() ) {
				ui.enableButton('prev-button');
			} else {
				ui.disableButton('prev-button');
			}
		} else {
			ui.hideButton('next-button');
			ui.hideButton('button-separator');
			ui.hideButton('prev-button');
		}
	}

	function markBookmark( path ) {
		var bookmarkFile,
		    selectedChildPath = '',
		    selectedChildBookmark,
		    matchFound = false,
		    i;

		console.log( 'Path:', path);


		for ( i = 0; i < bookmarkCount; i++ ) {


			(function(){
				bookmarkFile = bookmarkFiles[i];

				bookmarkFile.getAbsolutePath(function( err, bookmarkPath ) {

					if ( bookmarkPath === path || bookmarkPath + '/' === path ) {
						bookmarkFile.element.classList.add('selected');
						matchFound = true;
						console.log( 'Match found' );
					} else {
						bookmarkFile.element.classList.remove('selected');

						if ( path.startsWith( bookmarkPath) ) {

							if ( selectedChildPath.length < bookmarkPath.length ) {
								selectedChildPath = bookmarkPath;
								selectedChildBookmark = bookmarkFile;
								console.log( 'Found Child:', bookmarkPath);
							}
						}
					}

					bookmarkFile.element.classList.remove('child-selected');
				});
			}());

		}

		if ( selectedChildBookmark && ! matchFound ) {
			console.log( 'Marking Child Bookmark:', selectedChildPath );
			selectedChildBookmark.element.classList.add('child-selected');
		}
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
						var displayName = undefined,
						    isDirectory = undefined;

						if ( absoluteFilePath === '/')
							displayName = '/';

						if ( absoluteFilePath === ndeFs.userHome )
							displayName = 'Home';

						if ( absoluteFilePath === 'applications://') {
							displayName = 'Applications';
							isDirectory = true;
						}

						var bookmarkFile = new BookmarkFile({
							absoluteFilePath: absoluteFilePath,
							isDirectory: isDirectory,
							displayName: displayName
						});

						bookmarkFiles.push( bookmarkFile );
						bookmarkCount++;

						ui.addBookmarkFileToSection( bookmarkFile, sectionId );
					}.bind(this));
				}.bind(this)());
			}
		});
	}

	(function init() {
		//////////////////
		// init modules //

		iconPathFetcher = new IconPathFetcher();
		ndeFs           = new NdeFs({iconPathFetcher: iconPathFetcher});
		ndeHistory      = new NdeHistory();
		ui              = new UI({
		                             document: document,
		                             window:   window,
		                             iconPathFetcher: iconPathFetcher
		                         });


		/////////////////////
		// parse CLI flags //
		var args = argParser.default({ debug : false })
		.boolean(['debug'])
		.parse(nwGui.App.argv);


		///////////////
		// configure //
		debug = args.debug;

		var startDir = args._[0] || ndeFs.userHome + '/';

		if ( debug ) {
			nwGui.Window.get().showDevTools();
		}

		ndeFs.validPathCallback = function( path ) {
			ndeHistory.push( path );
			ui.setLocation( path );
			// renderUpButton();
			// renderHistoryButtons();
			markBookmark( path );
		};

		ndeFs.onFiles = ui.setFiles;


		/////////////////
		// UI Handlers //
		ui.onLocationChange(function( path ){
			console.log('onLocationChange', path);
			ndeFs.getFilesInDirectory( path );
		});

		ui.onHideClick();

		// ui.onNextClick(function(){
		// 	ndeFs.getFilesInDirectory( ndeHistory.getNext() );
		// });

		// ui.onPrevClick(function(){
		// 	ndeFs.getFilesInDirectory( ndeHistory.getPrevious() );
		// });

		ui.onLocationEscape(function(){
			ui.setLocation(ndeFs.currentDirectory);
		});

		// ui.onUpClick(function(){
		// 	ndeFs.getFilesInDirectory( ndeFs.getParentDirectory() );
		// });

		ui.onfilerequestopen = ndeFs.openFile;

		ui.fileDeleteHandler = function( files ) {
			if ( window.confirm('Delete File(s)?') ) {
				files.forEach(function( file ){
					ndeFs.removeFile( file, function( err ) {
						if ( err ) alert('Failed to remove File!\n' + err);
					});
				});
			}
		};

		ui.onfilerename = function( sourceFile, targetFile ) {
			ndeFs.renameFile( sourceFile, targetFile , function( err ) {
				if ( err ) {
					alert('Failed to rename/move file!\n' +
					       sourceFile + '\n' +
					       targetFile + '\n' +
					       err);
				}
			});
		};

		ui.onfilecopy = function( sourceFile, targetFile ) {
			ndeFs.copyFile( sourceFile, targetFile , function( err ) {
				if ( err ) {
					alert('Failed to copy file!\n' +
					       sourceFile + '\n' +
					       targetFile + '\n' +
					       err);
				}
			});
		};

		ui.onnewfile = function( fileName ) {
			var absPath = ndeFs.currentDirectory + '/' + fileName;

			ndeFs.newFile(absPath, function( err ) {
				if ( err ) {
					if ( err.errno === -17 ) {
						alert('Can\'t create file. File already exists!');
					} else {
						alert('Failed to create file!\n' + err);
					}
				}
				console.log('New file err', err);
			});
		};

		/////////////
		// Execute //
		ui.setView(view);

		addBookmarks( bookmarks );


			ndeFs.getFilesInDirectory( startDir );

	}());
}