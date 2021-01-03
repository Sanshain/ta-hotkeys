// @ts-nocheck
function redoLog(storage) {

	if (!storage) {

		document.querySelector('.log__redo').innerHTML = '';

		for (let state of (storage || redoStorage)) {

			let logItem = document.createElement('p');
			logItem.innerText = JSON.stringify(state);
			document.querySelector('.log__redo').appendChild(logItem);
		}
		redoLog(undoStorage);
	}
	else {
		console.clear();
		for (let state of storage) console.log(state);
	}
}