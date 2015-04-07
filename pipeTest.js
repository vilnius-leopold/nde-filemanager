var now        = require("performance-now"),
    fs         = require('fs'),
    async      = require('async'),
    File       = require(__dirname + '/File.js'),
    FileSorter = require(__dirname + '/FileSorter.js'),
    FileFilter = require(__dirname + '/FileFilter.js');

console.log('Modules loaded:', now().toFixed(3));

// Settings
var pwd            = '/home/leo/',
    sortSettings   = ['directoryFirst', 'fileName'],
    filterSettings = ['hiddenFiles'];

// NOTE:
// with sort 25ms runtime
// Currently 7ms panelty due to sorting
// Filtering improves performance by 3ms (depending on amount of files)
// So there are about 18ms of code nothing to do with filtering or sorting

// sortSettings   = [];
// filterSettings = [];

var fileCount  = 0,
    fileSorter = new FileSorter( sortSettings ),
    fileFilter = new FileFilter( filterSettings );

fileSorter.onsorted = function( sortedFiles ) {
	var sortedFileNames = sortedFiles.map(function( file ) {
		return file.getCachedFileName();
	});

	console.log('Files:\n', sortedFileNames);
	console.log('Total    files:', fileCount);
	console.log('Filtered files:', fileSorter.fileCount);
	console.log('Benchmark:', now().toFixed(3));
};

fs.readdir(pwd, function( err, fileList ) {
	console.log('Files retrieved:', now().toFixed(3));

	var fileName,
	    file,
	    i;

	fileCount = fileList.length;

	for ( i = 0; i < fileCount; i++ ) {
		fileName = fileList[i];

		file = new File(fileName, pwd);

		fileFilter.onPass(file, fileSorter.add);
	}

	// close file sorter
	fileSorter.add( null );
	console.log('Files passed to filter and sorter:', now().toFixed(3));
});