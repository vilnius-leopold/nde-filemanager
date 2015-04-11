// defaults
var currentDirectory = '/home/leo/',
    view             = 'icons'; // rows/icons, default is icons

// Mimetype determination
//
// quick    (quick but only extension based)
// exact    (exact but slow)
// combined (quick else exact)
// assured  (like combined but double check quick ones)
var mimeLookup = 'combined';

// set empty string ''
// to have a section
// without title
var bookmarks = {
	'Favorite': [
		'/home/leo',
		'/home/leo/Downloads',
		'/home/leo/Videos',
		'/home/leo/Documents',
		'/home/leo/Projects',
		'/home/leo/Games'
		// 'Applications.desktop',
		// 'Settings.desktop',
	],
	'Administration': [
		'/home/leo/bin',
		'/home/leo/.local',
		'/home/leo/.config',
		'/'
	],
	'Devices': [
		'/media/Share'
	]
};