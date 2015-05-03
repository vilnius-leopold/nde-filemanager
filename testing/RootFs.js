var cp = require('child_process'),
    fs = require('fs');

if ( process.getuid() !== 0 ) {
	console.log("STATUS: FAIL");
	console.log("ERROR: You are not root!");
	process.exit(1);
}

var dataString = process.argv[ process.argv.length - 1];

try {
	var args = JSON.parse( dataString );

	fs.writeFileSync( args[0], args[1], args[2]);

	console.log("STATUS: SUCCESS");
	process.exit(0);
} catch(e) {
	console.log("STATUS: FAIL");
	console.log("ERROR: " + e );
}

process.exit(1);
