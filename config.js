var currentDirectory = '/home/leo/',
    iconTheme        = 'Flattr';


var folderIconMapping = {
	'/home/leo':           'places/64/user-home',
	'/home/leo/Downloads': 'places/64/folder-download',
	'/home/leo/Videos':    'places/64/folder-videos',
	'/home/leo/Documents': 'places/64/folder-documents',
	'/home/leo/Projects':  'places/64/folder-templates',
	'/home/leo/Desktop':   'places/64/user-desktop',
	'/media/Share':        'devices/64/drive-harddisk'
};

// set empty string ''
// to have a section
// without title
var bookmarks = {
	'Favorite': [
		'/home/leo',
		'/home/leo/Downloads',
		'/home/leo/Videos',
		'/home/leo/Documents',
		'/home/leo/Projects'
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