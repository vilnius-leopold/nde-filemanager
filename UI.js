var FileRenderer  = require('./FileRenderer.js');

function UI( document ) {
	var fileRenderer;

	// UI elements
	var contentElement,
	    menuElement,
	    sidebarElement,
	    filesElement,
	    scrollPaneElement,
	    locationElement,
	    actionElement,
	    contextmenuElement,
	    selectionOverlay,
	    navButtonContainer,
	    nextButtonElement,
	    prevButtonElement;

	var selectedFile,
	    locationBarKeyControlsActive = true,
	    cutFiles = [],
	    fileCount = 0,
	    fileObjects = [];

	var upClickHandler        = function(){},
	    selectedClickHandler  = function(){},
	    hintHandler           = function(){},
	    locationEscapeHandler = function(){},
	    locationChangeHandler = function(){},
	    onFileClickHandler    = function(){};

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
		return document.querySelector('#location').value;
	};

	// must likely run on directory change
	this.setLocation = function( path ) {
		document.querySelector('#location').value = path;

		// blur so we can use
		// enter/backspace buttons
		// for navigation
		locationElement.blur();
	};

	this.addFile = function( file ) {
		fileRenderer.render(file, function( fileElement ) {
			filesElement.appendChild( fileElement );
		});
	}.bind(this);

	this.setFiles = function( files ) {
		var file,
		    i;

		fileObjects = files;

		fileCount = files.length;

		this.clear('files');
		selectedFile = null;

		if ( fileCount > 0 ) {
			selectedFile = files[0];

			window.requestAnimationFrame(function() {
				for ( i = 0; i < fileCount; i++ ) {
					file = files[i];
					this.addFile(file);
				}
			}.bind(this));
		}
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

	this.onFileClick = function( callback ) {
		onFileClickHandler = callback;
	};

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

	function selectFiles( startX, startY, endX, endY ) {
		unselectFiles();

		var fileWidth      = 170,
		    fileHeight     = 160,
		    availableWidth = filesElement.offsetWidth - parseInt(filesStyle.paddingLeft) - parseInt(filesStyle.paddingRight),
		    columneCount   = parseInt( availableWidth / fileWidth );

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
		    selectedColumneEnd   = Math.min( columneCount, parseInt( endX / fileWidth ) );

		// selection does not surround
		// a columne --> empty selection
		if ( selectedColumneStart === selectedColumneEnd )
			return [];

		// unselectFiles();

		for ( var i = selectedRowStart; i < selectedRowEnd; i++ ) {
			var rowOffset = i * columneCount;

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
					var index = selectedFiles.indexOf( fileObj );

					if (index > -1) {
						selectedFiles.splice(index, 1);
					}

					target.unselect();
				} else {
					// add file
					selectedFiles.push( fileObj );
					target.select();
				}
			} else {
				onFileClickHandler( fileObj );
			}
		// if bookmark
		} else {
			if (target.classList.contains('item') )  {
				onFileClickHandler( fileObj );
			}

			if (parent.classList.contains('item') )  {
				onFileClickHandler( parent.obj );
			}
		}

	});

	function closeContextMenu() {
		contextMenu.remove();
		isContextMeuOpen = false;
	}

	this.fileDeleteHandler = function( files ) {
		console.log('File delete handler trigger', files);
	};

	this.fileCutHandler = function( files ) {
		console.log('File cut handler trigger', files);

		cutFiles = files;
	};

	this.filePasteIntoHandler = function( files ) {
		console.log('File paste into handler trigger', files);

		var targetDirectory = files[0];

		targetDirectory.getAbsolutePath(function( err, dirPath ){
			cutFiles.forEach(function( cutFile ){
				cutFile.getFileName(function( err, fileName ) {
					cutFile.getAbsolutePath(function( err, absPath ) {
						console.log('Move:', absPath, '-->', dirPath + '/' + fileName);

						this.onfilerename(absPath, dirPath + '/' + fileName);
					}.bind(this));
				}.bind(this));
			}.bind(this));

			cutFiles = [];
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

		var deleteItem            = contextMenuItem.cloneNode();
		deleteItem.textContent    = 'Delete File';
		deleteItem.actionCallback = this.fileDeleteHandler;
		deleteItem.fileObj        = fileObj;
		contextMenu.appendChild( deleteItem );

		var cutItem            = contextMenuItem.cloneNode();
		cutItem.textContent    = 'Cut';
		cutItem.actionCallback = this.fileCutHandler;
		cutItem.fileObj        = fileObj;
		contextMenu.appendChild( cutItem );

		if ( cutFiles.length > 0 && fileObj.cachedIsDirectory() ) {
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

	this.onPrevClick = function( callback ) {
		prevButtonElement.addEventListener('click', function( ev ) {
			if ( ! prevButtonElement.classList.contains('disabled') )
				callback();
		});
	};

	this.onNextClick = function( callback ) {
		nextButtonElement.addEventListener('click', function( ev ) {
			if ( ! nextButtonElement.classList.contains('disabled') )
				callback();
		});
	};

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

	this.onUpClick = function( callback ) {
		upClickHandler = callback;

		document.querySelector('#up-button')
		.addEventListener('click', function( ev ) {
			upClickHandler();
		});
	};

	this.onHideClick = function( callback ) {
		document.querySelector('#hide-button').addEventListener('click', function( ev ) {
			document.querySelector('#files').classList.toggle('hide-hidden');
		});
	};

	document.querySelector('#new-file-button').addEventListener('click', function( ev ) {
		var dialog = document.querySelector('nde-newfile-dialog');

		dialog.oncreate = this.onnewfile;

		// location bar steals focus
		// when starting to type
		// --> toggle on/off for dialog
		dialog.onopen = function() {
			locationBarKeyControlsActive = false;
		};
		dialog.onclose = function() {
			locationBarKeyControlsActive = true;
		};
		dialog.open();
	}.bind(this));

	(function init() {
		// init renderer
		fileRenderer = new FileRenderer( document );

		// cache elements
		contentElement     = document.querySelector('#content');
		menuElement        = document.querySelector('#menu-bar');
		sidebarElement     = document.querySelector('#sidebar');
		filesElement       = document.querySelector('#files');
		scrollPaneElement  = document.querySelector('#scroll-pane');
		locationElement    = document.querySelector('#location');
		actionElement      = document.querySelector('#actions');
		contextmenuElement = document.querySelector('.context-menu');
		navButtonContainer = document.querySelector('#nav-button-container');
		nextButtonElement  = document.querySelector('#next-button');
		prevButtonElement  = document.querySelector('#prev-button');
		createOverlay();

		// cache style reference
		filesStyle = window.getComputedStyle(filesElement);

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

		};

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
						if ( selectedFile ) onFileClickHandler( selectedFile );
						break;
				}
			} else {
				if ( keyCode === 27 ) {
					locationElement.blur();
				} if (keyCode == 13) {
					var location = this.getLocation();

					// if ( location.substr(location.length - 1) != '/' )
						// location += '/';


					locationChangeHandler(location);
				} else {
					var hint = locationElement.value;
					hintHandler();
				}
			}
			/*
				// entire filelist with hidden files
				fileList.each file
					if file.getCachedAbsoluteName().startsWith(hint)
						add to suggestion
					end
				end

				if no suggestions
					check recently used locations

				if no recent
					search entire filesystem

				ontabHit.use highest suggestion
				--> set location

				onUp/Down hit --> cycle through suggestions
			*/
		}.bind(this);
	}.bind(this)());
}

module.exports = UI;