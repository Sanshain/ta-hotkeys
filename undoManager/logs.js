// @ts-nocheck
export function redoLog(storage) {

	console.clear(); for (let state of storage.undo) console.log(state);

	document.querySelector('.log__redo').innerHTML = ''; for (let state of storage.redo) {

		let logItem = document.createElement('p');
		logItem.innerText = JSON.stringify(state);
		document.querySelector('.log__redo').appendChild(logItem);

	}
	
}