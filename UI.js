var FileRenderer  = require('./FileRenderer.js'),
    DesktopFile   = require('./DesktopFile.js');

function UI( options ) {
	var document = options.document,
	    window   = options.window;

	var fileRenderer;

	// UI elements
	var contentElement,
	    menuElement,
	    newfileDialog,
	    sidebarElement,
	    filesElement,
	    scrollPaneElement,
	    breadcrumbElement,
	    locationElement,
	    actionElement,
	    contextmenuElement,
	    // navButtonContainer,
	    // nextButtonElement,
	    // prevButtonElement,
	    selectionOverlay;

	var fileWidth  = 170,
	    fileHeight = 160;

	var selectedFile,
	    currentFile,
	    currentFilePosition = 0,
	    locationBarKeyControlsActive = true,
	    cutFiles    = [],
	    copyFiles   = [],
	    cutMode     = false,
	    copyMode    = false,
	    fileCount   = 0,
	    fileObjects = [],
	    viewFileObjects = [];

	var upClickHandler        = function(){},
	    selectedClickHandler  = function(){},
	    hintHandler           = function(){},
	    locationEscapeHandler = function(){},
	    locationChangeHandler = function(){};

	/*
		add contextmenu event listener to window
		on contextclick if file item
		open contextmenu
		on contextmenu option click
		run callback for
		- delete
		- rename
		- copy
		- cut
	*/

	this.getLocation = function() {
		return breadcrumbElement.getPath();
	};

	// must likely run on directory change
	this.setLocation = function( path ) {
		if ( newfileDialog.isOpen() )
			newfileDialog.close();

		// locationElement.value = path;

		// blur so we can use
		// enter/backspace buttons
		// for navigation
		// locationElement.blur();
		breadcrumbElement.setPath( path );
	};

	this.addFile = function( file ) {
		fileRenderer.render(file, function( fileElement ) {
			filesElement.appendChild( fileElement );
		});
	}.bind(this);

	this.setViewFiles = function( files ) {
		var file,
		    i;

		viewFileObjects = files;

		fileCount = files.length;

		this.clear('files');
		selectedFile = null;
		currentFile = null;
		currentFilePosition = 0;

		if ( fileCount > 0 ) {
			selectedFile = files[0];
			currentFile = files[currentFilePosition];

			window.requestAnimationFrame(function() {
				for ( i = 0; i < fileCount; i++ ) {
					file = files[i];
					this.addFile(file);
					file.element.position = i;
				}
				currentFile.element.makeCurrent();
			}.bind(this));
		}
	}.bind(this);

	this.setFiles = function( files ) {
		fileObjects = files;

		this.setViewFiles( files );
	}.bind(this);

	this.setView = function( view ) {
		filesElement.classList.add('view-' + view);
	};

	this.addSidebarSection = function( sectionName ) {
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
	};

	this.clear = function( container ){
		container = container || 'files';
		document.querySelector('#' + container).innerHTML = '';
	};

	this.getScrollPosition = function() {
		return document.querySelector('#content').scrollTop;
	};

	this.setScrollPosition = function(value) {
		document.querySelector('#content').scrollTop = value;
	};

	this.onLocationChange = function( callback ) {
		locationChangeHandler = callback;
	}.bind(this);

	this.addBookmarkFileToSection = function( file, sectionId ) {
		fileRenderer.renderInline(file, function( fileElement ) {
			document.querySelector('#' + sectionId).appendChild( fileElement );
		}.bind(this));
	}.bind(this);

	this.makeCurrent = function( file ) {
		// this.onsetcurrentfile
		currentFile.element.unmakeCurrent();
		currentFilePosition = file.element.position;
		currentFile = file;
		file.element.makeCurrent();
	};

	this.requestFileOpen = function( fileObj ) {
		this.makeCurrent( fileObj );

		this.onfilerequestopen( fileObj );
	}.bind(this);

	////////////////////
	// FILE SELECTION //
	var startX,
	    startY,
	    currentX,
	    currentY,
	    endX,
	    endY,
	    top,
	    bottom,
	    left,
	    right,
	    width,
	    height;

	var committedSelectedFiles = [],
	    selectedFiles = [],
	    additionMode  = false;

	// no need to update on resize
	// as this is a **reference** to
	// the style object
	var filesStyle;

	function unselectFiles() {
		var file;

		while ( file = selectedFiles.pop() ) {
			if (file) file.element.removeAttribute('selected');
		}
	}

	function commitSelectedFiles () {
		committedSelectedFiles = committedSelectedFiles.concat( selectedFiles );
		selectedFiles = [];
	}

	function unselectCommittedFiles() {
		var file;

		while ( file = committedSelectedFiles.pop() ) {
			if (file) file.element.removeAttribute('selected');
		}
	}

	function calculateColumnCount() {
		var availableWidth = filesElement.offsetWidth - parseInt(filesStyle.paddingLeft) - parseInt(filesStyle.paddingRight);

		return parseInt( availableWidth / fileWidth );
	}

	function selectFiles( startX, startY, endX, endY ) {
		unselectFiles();

		var columnCount = calculateColumnCount();

		// center selection point
		startX += fileWidth/2;
		endX   += fileWidth/2;
		startY += fileHeight/2;
		endY   += fileHeight/2;

		var selectedRowStart = parseInt( startY / fileHeight ),
		    selectedRowEnd   = parseInt( endY / fileHeight );

		// selection does not surround
		// a row --> empty selection
		if ( selectedRowStart === selectedRowEnd )
			return [];

		var selectedColumneStart = Math.max( 0, parseInt( startX / fileWidth ) ),
		    selectedColumneEnd   = Math.min( columnCount, parseInt( endX / fileWidth ) );

		// selection does not surround
		// a columne --> empty selection
		if ( selectedColumneStart === selectedColumneEnd )
			return [];

		// unselectFiles();

		for ( var i = selectedRowStart; i < selectedRowEnd; i++ ) {
			var rowOffset = i * columnCount;

			for ( var k = selectedColumneStart; k < selectedColumneEnd; k++ ) {
				var fileNumber = rowOffset + k;
				var file = fileObjects[fileNumber];

				if ( file ) {
					if (
					    selectedFiles.indexOf(file) === -1 &&
					    committedSelectedFiles.indexOf(file) === -1
					) {
						selectedFiles.push(file);
					}

					file.element.select();
				}
			}
		}
	}

	function setOverlay( left, top, width, height ) {
		var style = selectionOverlay.style;

		style.left    = left + 'px';
		style.top     = top + 'px';
		style.width   = width + 'px';
		style.height  = height + 'px';
	}

	function updateCoordinates( x1, y1, x2, y2 ) {
		top    = y2 <= y1 ? y2 : y1;
		bottom = y2 >  y1 ? y2 : y1;
		left   = x2 <= x1 ? x2 : x1;
		right  = x2 >  x1 ? x2 : x1;
		width  = right - left;
		height = bottom - top;
	}

	function calculateRelativeX( clientX ) {
		return clientX - scrollPaneElement.offsetLeft;
	}

	function calculateRelativeY( clientY ) {
		return clientY + scrollPaneElement.scrollTop - scrollPaneElement.offsetTop;
	}

	function mouseMoveHandler( ev ) {
		currentX = calculateRelativeX( ev.clientX );
		currentY = calculateRelativeY( ev.clientY );

		updateCoordinates( startX, startY, currentX, currentY );

		setOverlay( left, top, width, height );

		selectFiles( left, top, right, bottom );
	}

	function mouseUpHandler( ev ) {
		endX = calculateRelativeX( ev.clientX );
		endY = calculateRelativeY( ev.clientY );

		updateCoordinates( startX, startY, endX, endY );

		// deduct menubar + filesElement paddig
		//  and sidebar offsets
		selectFiles( left, top, right, bottom );

		window.removeEventListener('mousemove', mouseMoveHandler);
		window.removeEventListener('mouseup', mouseUpHandler);

		commitSelectedFiles();

		hideOverlay();
	}

	function mouseDownHandler( ev ) {
		var target = ev.target;

		if ( target === filesElement ||
		     target === contentElement ||
		     target === scrollPaneElement
		) {
			if ( ev.ctrlKey ) {
				additionMode = true;
			} else {
				unselectCommittedFiles();
				additionMode = false;
			}

			startX = calculateRelativeX( ev.clientX );
			startY = calculateRelativeY( ev.clientY );

			setOverlay( startX, startY, 1, 1 );

			showOverlay();

			window.addEventListener('mousemove', mouseMoveHandler);
			window.addEventListener('mouseup', mouseUpHandler);
		}
	}

	function createOverlay() {
		selectionOverlay = document.createElement('div');
		selectionOverlay.id = 'selection-overlay';
		scrollPaneElement.appendChild( selectionOverlay );
	}

	function showOverlay() {
		selectionOverlay.style.display = 'block';
	}

	function hideOverlay() {
		selectionOverlay.style.display = 'none';
	}

	window.addEventListener('mousedown', mouseDownHandler);

	//////////////////
	// CONTEXT MENU //
	var isContextMeuOpen = false,
	    contextMenu;

	window.addEventListener('click', function( ev ) {
		var target = ev.target,
		    parent = target.parentNode;


		if ( isContextMeuOpen &&
			target.id !== 'context-menu' &&
			parent.id !== 'context-menu'
		) {
			closeContextMenu();
			return;
		}

		var fileObj = target.obj;

		// if file
		if ( target.tagName === 'NDE-FILE' ) {

			if ( ev.ctrlKey ) {
				if ( target.selected ) {
					// remove file
					var index = committedSelectedFiles.indexOf( fileObj );

					if (index > -1) {
						committedSelectedFiles.splice(index, 1);
					}

					target.unselect();
				} else {
					// add file
					committedSelectedFiles.push( fileObj );
					target.select();
				}
			} else {
				this.requestFileOpen( fileObj );
			}
		// if bookmark
		} else {
			if (target.classList.contains('item') )  {
				this.requestFileOpen( fileObj );
			}

			if (parent.classList.contains('item') )  {
				this.requestFileOpen( parent.obj );
			}
		}

	}.bind(this));

	function closeContextMenu() {
		contextMenu.remove();
		isContextMeuOpen = false;
	}

	this.fileDeleteHandler = undefined;

	this.fileCutHandler = function( files ) {
		cutFiles = [];
		cutFiles = files;
		cutMode  = true;
		copyMode = false;
	};

	this.fileCopyHandler = function( files ) {
		copyFiles = [];
		copyFiles = files;
		copyMode  = true;
		cutMode   = false;
	};

	this.fileUninstallHandler = function( files ) {
		files[0].uninstall();
	};

	this.fileEditHandler = function( files ) {
		files[0].edit();
	};

	this.desktopFileNoDisplayHandler = function( files ) {
		files[0].setDesktopFileProperty('NoDisplay', 'true', function(err){
			console.log('Error:', err);
		});
	};


	this.fileRenameHandler = function( files ) {
		var renameFile = files[0];

		renameFile.getFileName(function( err, fileName ) {
			if ( err ) console.error( 'Failed to rename file', err );

			newfileDialog.oncreate = function( newFileName ) {
				renameFile.getParentDirectory(function( err, parentDirectory ) {
					if ( err ) console.error( 'Failed to rename file', err );

					console.log( 'Renaming',  parentDirectory + fileName,  parentDirectory + newFileName);
					this.onfilerename( parentDirectory + fileName, parentDirectory + newFileName);
				}.bind(this));
			}.bind(this);

			newfileDialog.onopen = function() {
				locationBarKeyControlsActive = false;
			};
			newfileDialog.onclose = function() {
				locationBarKeyControlsActive = true;
			};

			newfileDialog.open();
			newfileDialog.setFileName( fileName );
		}.bind(this));
	}.bind(this);

	this.filePasteIntoHandler = function( files ) {
		var targetDirectory = files[0];

		var pasteFiles = [],
		    eventHandler;

		if ( cutMode ) {
			pasteFiles = cutFiles;
			eventHandler   = this.onfilerename;
		} else if ( copyMode ) {
			pasteFiles = copyFiles;
			eventHandler   = this.onfilecopy;
		}

		targetDirectory.getAbsolutePath(function( err, dirPath ) {
			if ( err ) console.error('Failed to paste into folder', err);

			pasteFiles.forEach(function( file ){
				file.getFileName(function( err, fileName ) {
					if ( err ) console.error('Failed to paste into folder', err);

					file.getAbsolutePath(function( err, absPath ) {
						if ( err ) console.error('Failed to paste into folder', err);

						eventHandler(absPath, dirPath + '/' + fileName);
					}.bind(this));
				}.bind(this));
			}.bind(this));

			cutFiles  = [];
			copyFiles = [];
			copyMode  = false;
			cutMode   = false;
		}.bind(this));
	}.bind(this);

	var openFileContextMenu = function ( ev ) {
		if ( isContextMeuOpen ) closeContextMenu();

		isContextMeuOpen = true;

		var fileObj = ev.target.obj;

		// create context menu
		contextMenu = document.createElement('div');
		contextMenu.id  = 'context-menu';

		// with context menu items
		var contextMenuItem       = document.createElement('div');
		contextMenuItem.className = 'context-menu-item';

		if ( fileObj instanceof DesktopFile ) {
			var uninstallItem            = contextMenuItem.cloneNode();
			uninstallItem.textContent    = 'Uninstall';
			uninstallItem.actionCallback = this.fileUninstallHandler;
			uninstallItem.fileObj        = fileObj;
			contextMenu.appendChild( uninstallItem );

			var editItem            = contextMenuItem.cloneNode();
			editItem.textContent    = 'Edit';
			editItem.actionCallback = this.fileEditHandler;
			editItem.fileObj        = fileObj;
			contextMenu.appendChild( editItem );

			var noDisplayItem            = contextMenuItem.cloneNode();
			noDisplayItem.textContent    = 'Hide';
			noDisplayItem.actionCallback = this.desktopFileNoDisplayHandler;
			noDisplayItem.fileObj        = fileObj;
			contextMenu.appendChild( noDisplayItem );
		} else {
			var deleteItem            = contextMenuItem.cloneNode();
			deleteItem.textContent    = 'Delete';
			deleteItem.actionCallback = this.fileDeleteHandler;
			deleteItem.fileObj        = fileObj;
			contextMenu.appendChild( deleteItem );

			var cutItem            = contextMenuItem.cloneNode();
			cutItem.textContent    = 'Cut';
			cutItem.actionCallback = this.fileCutHandler;
			cutItem.fileObj        = fileObj;
			contextMenu.appendChild( cutItem );

			var copyItem            = contextMenuItem.cloneNode();
			copyItem.textContent    = 'Copy';
			copyItem.actionCallback = this.fileCopyHandler;
			copyItem.fileObj        = fileObj;
			contextMenu.appendChild( copyItem );

			var renameItem            = contextMenuItem.cloneNode();
			renameItem.textContent    = 'Rename';
			renameItem.actionCallback = this.fileRenameHandler;
			renameItem.fileObj        = fileObj;
			contextMenu.appendChild( renameItem );
		}

		if ( (
				( cutMode && cutFiles.length > 0 ) ||
				( copyMode & copyFiles.length > 0 )
			) && fileObj.cachedIsDirectory()
		) {
			var pasteIntoItem            = contextMenuItem.cloneNode();
			pasteIntoItem.textContent    = 'Paste into';
			pasteIntoItem.actionCallback = this.filePasteIntoHandler;
			pasteIntoItem.fileObj        = fileObj;
			contextMenu.appendChild( pasteIntoItem );
		}

		// add event handler for items
		// add window handler for closing
		contextMenu.addEventListener('click', function( ev ) {
			var menuItem = ev.target;

			if ( menuItem.classList.contains('context-menu-item') ) {
				var selectedFileObj = menuItem.fileObj;

				if ( selectedFileObj.element.selected ) {
					menuItem.actionCallback( committedSelectedFiles );
				} else {
					menuItem.actionCallback( [selectedFileObj] );
				}

				closeContextMenu();
			}
		});


		// add context-menu to ui
		contextMenu.style.top  = ev.clientY + 'px';
		contextMenu.style.left = ev.clientX + 'px';
		document.body.appendChild( contextMenu );
	}.bind(this);

	window.addEventListener('contextmenu', function( ev ) {
		var target = ev.target;

		if (target.tagName === 'NDE-FILE' )  {
			openFileContextMenu( ev );
		} else if ( isContextMeuOpen ) {
			closeContextMenu();
		}
	});

	this.onFileContextClick = function( callback ) {
	};

	// this.onPrevClick = function( callback ) {
	// 	prevButtonElement.addEventListener('click', function( ev ) {
	// 		if ( ! prevButtonElement.classList.contains('disabled') )
	// 			callback();
	// 	});
	// };

	// this.onNextClick = function( callback ) {
	// 	nextButtonElement.addEventListener('click', function( ev ) {
	// 		if ( ! nextButtonElement.classList.contains('disabled') )
	// 			callback();
	// 	});
	// };

	this.showButton = function( id ) {
		document.querySelector('#' + id).classList.remove('hide');
	};

	this.hideButton = function( id ) {
		document.querySelector('#' + id).classList.add('hide');
	};

	this.disableButton = function( id ) {
		document.querySelector('#' + id).classList.add('disabled');
	};

	this.enableButton = function( id ) {
		document.querySelector('#' + id).classList.remove('disabled');
	};

	this.onSelectedClick = function( callback ) {
		selectedClickHandler = callback;
	};

	this.onLocationEscape = function( callback ) {
		locationEscapeHandler = callback;
	};

	// this.onUpClick = function( callback ) {
	// 	upClickHandler = callback;

	// 	document.querySelector('#up-button')
	// 	.addEventListener('click', function( ev ) {
	// 		upClickHandler();
	// 	});
	// };

	this.onHideClick = function( callback ) {
		document.querySelector('#hide-button').addEventListener('click', function( ev ) {
			document.querySelector('#files').classList.toggle('hide-hidden');
		});
	};

	document.querySelector('#new-file-button').addEventListener('click', function( ev ) {

		newfileDialog.oncreate = this.onnewfile;

		// location bar steals focus
		// when starting to type
		// --> toggle on/off for newfileDialog
		newfileDialog.onopen = function() {
			locationBarKeyControlsActive = false;
		};
		newfileDialog.onclose = function() {
			locationBarKeyControlsActive = true;
		};
		newfileDialog.open();
	}.bind(this));

	// Returns two pattern
	// one generic fuzzy pattern
	// and one that requires the first
	// pattern character to also be
	// the first letter in the word
	// that should be matched
	// e.g.
	// ^w.*o.*r.*d.*
	// ^.*w.*o.*r.*d.*
	//
	// @return array [startFuzzyPattern, genericFuzzyPattern]
	function generateFuzzyPatterns( string ) {
		var stringLength = string.length,
		    patternString = '',
		    startPatternString = '',
		    pattern,
		    startPattern,
		    character;

		console.log("string", string);

		// word
		// .*w.*o.*r.*d.*
		for ( var i = 0; i < stringLength; i++ ) {
			console.log("character", i, character);
			character = string.charAt(i);
			character = character.replace(/([\.\[\]\\\/\+\*\?])/g,'\\$1');
			startPatternString += character + '.*';
		}

		patternString      = '^.*' + startPatternString;
		startPatternString = '^' + startPatternString;

		console.log("patternString", patternString);
		console.log("startPatternString", startPatternString);

		pattern      = new RegExp(patternString, 'i');
		startPattern = new RegExp(startPatternString, 'i');

		console.log("pattern", pattern);

		return [startPattern, pattern];
	}

	this.getMatches = function( entry ) {
		var patterns            = generateFuzzyPatterns(entry),
		    startFuzzyPattern   = patterns[0],
		    genericFuzzyPattern = patterns[1],
		    startMatchedFileObjects  = [],
		    matchedFileObjects  = [];

		console.log('entry', entry);

		fileObjects.forEach(function( fileObject ){
			var displayName = fileObject.getCachedDisplayName();
			if ( displayName.match( startFuzzyPattern ) ) {
				// console.log('Match', displayName);
				startMatchedFileObjects.push( fileObject );
				// fileObject.element.style.display = 'block';
			} else if ( displayName.match( genericFuzzyPattern ) ) {
				// console.log('Match', displayName);
				matchedFileObjects.push( fileObject );
				// fileObject.element.style.display = 'block';
			} else {
				// fileObject.element.style.display = 'none';
			}
		});

		console.log('MATCHES', matchedFileObjects);

		this.setViewFiles( startMatchedFileObjects.concat(matchedFileObjects) );
	}.bind(this);

	(function init( options ) {
		// init renderer
		fileRenderer = new FileRenderer({
		                                    document: options.document,
		                                    iconPathFetcher: options.iconPathFetcher
		                                });

		// cache elements
		newfileDialog      = document.querySelector('nde-newfile-dialog');
		contentElement     = document.querySelector('#content');
		menuElement        = document.querySelector('#menu-bar');
		sidebarElement     = document.querySelector('#sidebar');
		filesElement       = document.querySelector('#files');
		scrollPaneElement  = document.querySelector('#scroll-pane');
		locationElement    = document.querySelector('#location');
		breadcrumbElement  = document.querySelector('bread-crumbs');
		actionElement      = document.querySelector('#actions');
		contextmenuElement = document.querySelector('.context-menu');
		// navButtonContainer = document.querySelector('#nav-button-container');
		// nextButtonElement  = document.querySelector('#next-button');
		// prevButtonElement  = document.querySelector('#prev-button');
		createOverlay();

		// cache style reference
		filesStyle = window.getComputedStyle(filesElement);

		breadcrumbElement.oncrumbinput = this.getMatches;
		breadcrumbElement.onreturn = function( value ) {
			// console.log('Return value', value);
			locationChangeHandler( breadcrumbElement.getPath() + '/' + value );
			// breadcrumbElement.clearInput();
			breadcrumbElement.blur();
		};
		breadcrumbElement.oncrumbclick = function( path ) {
			console.log('UI crumb', path);

			locationChangeHandler( path );
		};

		document.onkeydown = function (ev) {
			var keyCode = ev.keyCode;

			console.log('Keypress', keyCode);

			if ( keyCode === 13 && currentFile )
				this.requestFileOpen( currentFile );

			if ( keyCode >= 37 || keyCode <= 40 ) {
				currentFile.element.unmakeCurrent();

				var fileCount = viewFileObjects.length;

				// right
				if ( keyCode === 39 ) {
					if ( currentFilePosition === fileCount - 1 ) {
						currentFilePosition = 0;
					} else {
						currentFilePosition += 1;
					}
				}

				// left
				if ( keyCode === 37 ) {
					if ( currentFilePosition === 0 ) {
						currentFilePosition = fileCount - 1;
					} else {
						currentFilePosition -= 1;
					}
				}

				var columnCount   = calculateColumnCount(),
				    currentColumn = currentFilePosition % columnCount;

				// down
				if ( keyCode === 40 ) {

					if ( currentFilePosition + columnCount > fileCount - 1 ) {
						currentFilePosition = currentColumn;
					} else {
						currentFilePosition += columnCount;
					}
				}

				// up
				if ( keyCode === 38 ) {
					if ( currentFilePosition - columnCount < 0 ) {
						var lastColumn = (fileCount - 1) % columnCount;

						// last row HAS same column
						if ( currentColumn <= lastColumn ) {
							currentFilePosition = fileCount - 1 - (lastColumn - currentColumn);
						// last row HAS NOT same column
						} else {
							currentFilePosition = fileCount - 1 - lastColumn - 1 - (columnCount - 1 - currentColumn);
						}
					} else {
						currentFilePosition -= calculateColumnCount();
					}

				}

				currentFile = viewFileObjects[currentFilePosition];
				console.log('New current file', currentFile);
				currentFile.element.makeCurrent();
			}
		}.bind(this);

		/*
		// key handlers
		document.onkeydown = function (e) {
			if ( ! locationBarKeyControlsActive ) return;

			var keyCode = e.keyCode;
			var letter = String.fromCharCode(keyCode);

			// key code table
			// http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
			var exclude = [
				9,  // tab
				8,  // backspace
				13, // enter
				27  // ESC
			];

			if ( exclude.indexOf( keyCode ) === -1 ) {
				locationElement.focus();
			}

		};

		document.onkeyup = function (e) {
			if ( ! locationBarKeyControlsActive ) return;

			var keyCode = e.keyCode;
			var letter = String.fromCharCode(keyCode);

			if ( keyCode === 27 && document.activeElement === locationElement ) {
				locationElement.blur();
				locationEscapeHandler();
			} else if ( keyCode === 8 && document.activeElement !== locationElement ) {
				upClickHandler();
			}

			this.getMatches();
		}.bind(this);

		document.onkeypress = function (e) {
			if ( ! locationBarKeyControlsActive ) return;

			var keyCode = e.keyCode;
			var letter = String.fromCharCode(keyCode);

			if ( document.activeElement !== locationElement ) {
				switch (keyCode) {
					case 8:
						upClickHandler();
						break;
					case 13:
						if ( selectedFile ) this.requestFileOpen( selectedFile );
						break;
				}
			} else {
				if ( keyCode === 27 ) {
					locationElement.blur();
				} if (keyCode == 13) {
					var location = this.getLocation();

					// if ( location.substr(location.length - 1) != '/' )
						// location += '/';


					if ( selectedFile ) this.requestFileOpen( selectedFile );
					// locationChangeHandler(location);
				} else {
					var hint = locationElement.value;
					hintHandler();
				}
			}


				// // entire filelist with hidden files
				// fileList.each file
				// 	if file.getCachedAbsoluteName().startsWith(hint)
				// 		add to suggestion
				// 	end
				// end

				// if no suggestions
				// 	check recently used locations

				// if no recent
				// 	search entire filesystem

				// ontabHit.use highest suggestion
				// --> set location

				// onUp/Down hit --> cycle through suggestions
		}.bind(this);
		*/

	}.bind(this)( options ));

	// prevent default behavior from changing page on dropped file
	window.ondragover = function(e) { e.preventDefault(); return false };
	window.ondrop = function(e) { e.preventDefault(); return false };

	var holder = document.body;
	holder.ondragover = function () { console.log('ondragover') };
	holder.ondragleave = function () { console.log('ondragleave') };
	holder.ondrop = function (e) {
		e.preventDefault();

		for (var i = 0; i < e.dataTransfer.files.length; ++i) {
			console.log(e.dataTransfer.files[i].path);
		}
		return false;
	};
}

module.exports = UI;