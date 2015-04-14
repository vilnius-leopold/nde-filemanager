

function NdeHistory() {
	var history = [];

	this.position = 0;

	this.push = function(path) {
		if ( path === history[this.position] ) {
			// do nothing
			console.log('Same dir. Do nothing.');
		} else if ( path === history[this.position-1] ) {
			// set history to previous point
			this.position = this.position - 1;
			console.log('Is prev dir. go back in histry.');
		} else if ( path === history[this.position+1] ) {
			// set history to next point
			console.log('Is next dir. go forward in histry.');
			this.position = this.position + 1;
		} else {
			console.log('New dir. Set new head.');
			// add item to history
			// set history to head
			// remove all old history between ( 0 and currentPos )
			if ( this.position !== 0 )
				history = history.slice(this.position, history.length);

			history.unshift(path);
			this.position = 0;
		}
	}.bind(this);

	this.getPrevious = function() {
		var pos = Math.min(this.position+1, history.length -1);
		return history[pos];
	}.bind(this);

	this.getNext = function() {
		var pos = Math.max(this.position-1, 0);
		return history[pos];
	}.bind(this);

	this.hasHistory = function() {
		return history.length > 1;
	};

	this.hasNext = function() {
		return this.position > 0;
	}.bind(this);

	this.hasPrevious = function() {
		return this.position < history.length -1;
	}.bind(this);

}

module.exports = NdeHistory;