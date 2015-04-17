var FileRenderer  = require('./FileRenderer.js');

function UI( document ) {
	var fileRenderer;

	// UI elements
	var contentElement,
	    menuElement,
	    sidebarElement,
	    filesElement,
	    locationElement,
	    actionElement,
	    contextmenuElement,
	    navButtonContainer,
	    nextButtonElement,
	    prevButtonElement;

	var selectedFile;

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
		// console.log('Adding file to UI:', file);

		fileRenderer.render(file, function( fileElement ) {
			filesElement.appendChild( fileElement );
		});
	}.bind(this);

	this.setFiles = function( files ) {
		var filteredFileCount = files.length,
		    file,
		    i;

		this.clear('files');
		selectedFile = null;

		if ( filteredFileCount > 0 ) {
			selectedFile = files[0];

			window.requestAnimationFrame(function() {
				for ( i = 0; i < filteredFileCount; i++ ) {
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

		// console.log('click');

		if (target.classList.contains('item') )  {
			// console.log('click item');
			onFileClickHandler( target.obj );
		}

		if (parent.classList.contains('item') )  {
			// console.log('click item');
			onFileClickHandler( parent.obj );
		}
	});

	function closeContextMenu() {
		contextMenu.remove();
		isContextMeuOpen = false;
	}

	this.fileDeleteHandler = function( file ) {
		console.log('File delete handler trigger', file);
	};

	var openFileContextMenu = function ( ev ) {
		if ( isContextMeuOpen ) closeContextMenu();

		console.log('Context menu click!');

		isContextMeuOpen = true;

		// create context menu
		contextMenu = document.createElement('div');
		contextMenu.id  = 'context-menu';

		// with context menu items
		var contextMenuItem       = document.createElement('div');
		contextMenuItem.className = 'context-menu-item';

		var deleteItem            = contextMenuItem.cloneNode();
		deleteItem.textContent    = 'Delete File';
		deleteItem.actionCallback = this.fileDeleteHandler;
		deleteItem.fileObj        = ev.target.obj;
		contextMenu.appendChild( deleteItem );

		console.log('handler', this.fileDeleteHandler);
		console.log('delte Item', deleteItem);
		console.log('delte Item actionCallback', deleteItem.actionCallback);

		// add event handler for items
		contextMenu.addEventListener('click', function( ev ) {
			var menuItem = ev.target;

			if ( menuItem.classList.contains('context-menu-item') ) {
				console.log('Item click ev', ev);
				console.log('Item click', menuItem);

				menuItem.actionCallback( menuItem.fileObj );
				closeContextMenu();
			}
		});

		// add window handler for closing

		// add context-menu to ui
		contextMenu.style.top  = ev.clientY + 'px';
		contextMenu.style.left = ev.clientX + 'px';
		document.body.appendChild( contextMenu );
	}.bind(this);

	window.addEventListener('contextmenu', function( ev ) {
		var target = ev.target;

		console.log('click');

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

	this.updateLayout = function () {
		window.requestAnimationFrame(function(){
		// 	console.log('Resizing');

			var height = window.innerHeight;

			var menuHeight   = menuElement.offsetHeight;
		// 	var sidebarWidth = sidebarElement.offsetWidth;
		// 	var actionWidth  = actionElement.offsetWidth;
		// 	var navButtonContainerWidth = navButtonContainer.offsetWidth;
		// 	var locationMarginRight = 5;

		// 	console.log(width,height,menuHeight,sidebarWidth);

		// 	filesElement.style.width = (width - sidebarWidth - actionWidth) + 'px';
		// 	contentElement.style.width = (width - sidebarWidth) + 'px';
		// 	locationElement.style.width = (width - navButtonContainerWidth - locationMarginRight ) + 'px';
			contentElement.style.height = (height - menuHeight) + 'px';
		// 	sidebarElement.style.height = (height - menuHeight) + 'px';
		});
	};

	(function init() {
		fileRenderer = new FileRenderer( document );

		contentElement     = document.querySelector('#content');
		menuElement        = document.querySelector('#menu-bar');
		sidebarElement     = document.querySelector('#sidebar');
		filesElement       = document.querySelector('#files');
		locationElement    = document.querySelector('#location');
		actionElement      = document.querySelector('#actions');
		contextmenuElement = document.querySelector('.context-menu');
		navButtonContainer = document.querySelector('#nav-button-container');
		nextButtonElement  = document.querySelector('#next-button');
		prevButtonElement  = document.querySelector('#prev-button');

		window.onresize = this.updateLayout;

		document.onkeydown = function (e) {
			var keyCode = e.keyCode;
			var letter = String.fromCharCode(keyCode);
			console.log('Keydown', keyCode, keyCode);
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
			var keyCode = e.keyCode;
			var letter = String.fromCharCode(keyCode);
			console.log('Keyup', keyCode, keyCode);

			if ( keyCode === 27 && document.activeElement === locationElement ) {
				locationElement.blur();
				locationEscapeHandler();
			} else if ( keyCode === 8 && document.activeElement !== locationElement ) {
				upClickHandler();
			}

		};

		document.onkeypress = function (e) {
			var keyCode = e.keyCode;
			var letter = String.fromCharCode(keyCode);

			console.log('Keypress', keyCode, keyCode);

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

		this.updateLayout();
	}.bind(this)());
}

module.exports = UI;