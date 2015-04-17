var express = require('express');
    app     = express();

app.use(express.static(process.argv[2] || __dirname));

var server = app.listen(8080, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);

});