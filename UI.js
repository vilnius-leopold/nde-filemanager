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
	var locationChangeHandler = function() {};

	this.onLocationChange = function( callback ) {
		locationChangeHandler = callback;


	}.bind(this);
	this.addBookmarkFileToSection = function( file, sectionId ) {
		fileRenderer.renderInline(file, function( fileElement ) {
			document.querySelector('#' + sectionId).appendChild( fileElement );
		}.bind(this));
	}.bind(this);
	this.onFileClick = function( callback ) {
		document.querySelector('body')
		.addEventListener('click', function( ev ) {
			var target = ev.target,
			    parent = target.parentNode;

			// console.log('click');

			if (target.classList.contains('item') )  {
				// console.log('click item');
				callback( target );
			}

			if (parent.classList.contains('item') )  {
				// console.log('click item');
				callback( parent );
			}
		});
	};
	this.onFileContextClick = function( callback ) {
		document.querySelector('body')
		.addEventListener('contextmenu', function( ev ) {
			var target = ev.target,
			    parent = target.parentNode;

			console.log('click');

			if (target.classList.contains('item') )  {
				console.log('click item');
				callback( target, ev.clientX, ev.clientY );
			}

			if (parent.classList.contains('item') )  {
				console.log('click item');
				callback( parent, ev.clientX, ev.clientY );
			}
		});
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

	var upClickHandler        = function(){},
	    selectedClickHandler  = function(){},
	    hintHandler           = function(){},
	    locationEscapeHandler = function(){};

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
			console.log('Resizing');

			var width  = window.innerWidth,
			    height = window.innerHeight;

			var menuHeight   = menuElement.offsetHeight;
			var sidebarWidth = sidebarElement.offsetWidth;
			var actionWidth  = actionElement.offsetWidth;
			var navButtonContainerWidth = navButtonContainer.offsetWidth;
			var locationMarginRight = 5;

			console.log(width,height,menuHeight,sidebarWidth);

			filesElement.style.width = (width - sidebarWidth - actionWidth) + 'px';
			contentElement.style.width = (width - sidebarWidth) + 'px';
			locationElement.style.width = (width - navButtonContainerWidth - locationMarginRight ) + 'px';
			contentElement.style.height = (height - menuHeight) + 'px';
			sidebarElement.style.height = (height - menuHeight) + 'px';
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

		console.log("WINDOW", window);

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
						selectedClickHandler();
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