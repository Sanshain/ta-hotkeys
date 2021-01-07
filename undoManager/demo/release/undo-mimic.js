(function () {
	'use strict';

	// @ts-nocheck
	function redoLog(storage) {

		console.clear(); for (let state of storage.undo) console.log(state);

		document.querySelector('.log__redo').innerHTML = ''; for (let state of storage.redo) {

			let logItem = document.createElement('p');
			logItem.innerText = JSON.stringify(state);
			document.querySelector('.log__redo').appendChild(logItem);

		}
		
	}

	// @ts-nocheck
	// var redoLog = (() => { });

	var editor = document.getElementById('editor') || document.querySelector('textarea'),	
		undoStorage = [],
		redoStorage = [],
		debug = false;

	function main(target, dbg) {
		debug = dbg;
		editor = target;
		return editor;
	}

	editor.addEventListener('keydown', function (event) {

		// console.log(event)

		input.selection = {
			start: event.target.selectionStart,
			end: event.target.selectionEnd,
		};

		if (input.selection_length) {
			input.lostData = editor.value.slice(
				input.selection.start,
				input.selection.end
			);
		}
		else {
			input.lostData = editor.value.slice(
				input.selection.start - 1,
				input.selection.end + 1
			);
		}

	});
	editor.addEventListener('paste', e => {

		input.data = (window.clipboardData || e.clipboardData).getData('text/plain');
		input.data = input.data.replace(/\r\n/g, '\n');
		// если вызвано из контекстного меню, то выделение надо ловить в контекстном меню

	});
	editor.addEventListener('input', event => {			// event.inputType && event.data	

		// console.log(event)

		if (event.inputType == 'historyUndo') {
			console.log(event.inputType);
			event.preventDefault();						// prevent need on keypress		
			return false;
		}


		input.type = event.inputType;
		if (input.type !== InputActionType.insertFromPaste) input.data = event.data;

		if (!input.selection_length) {
			if (input.type == InputActionType.deleteContentBackward) {
				input.selection.start--;
				input.selection.end--;
				input.lostData = input.lostData[0];
			}
			else if (input.type == InputActionType.deleteContentForward) input.lostData = input.lostData[1];
			else if (input.type == InputActionType.insertText || input.type == InputActionType.insertFromPaste) {

				input.lostData = input.lostData.slice(1, -1);
			}
		}
		else {

			// input.lostData = input.lostData.slice(1, -1); // !
			input.selection.end = input.selection.start; // + ((input.data || {}).length || 0);		

		}

		// action apply
		// InputTypeAction[event.inputType](event);
		undoStorage.push(Object.assign({}, input)); //  undoStorage.push(JSON.parse(JSON.stringify(input)))

		// clear redo action storage
		if (event.inputType != 'historyUndo') {

			redoStorage.splice(0, redoStorage.length);
			debug && redoLog(storage);
		}
		else debug && redoLog(storage);
	});


	const input = {

		type: null,		// 'insertFromPaste' | 'deleteByCut' | 'insertText' | 'deleteContentBackward' | ...
		data: null,		//  inserted char by 'insertText' type
		lostData: null, //  data been selected on insert

		get selection_length() { return this.selection.end - this.selection.start },
		selection: {
			start: null,
			end: null
		},
	};



	function actionApply(doingState, doingType) {

		if (Boolean(doingType) !== Boolean('redo')) var lostData = doingState.lostData, data = doingState.data;
		else {
			var data = doingState.lostData,
				lostData = doingState.data;
		}

		switch (doingState.type) {
			case 'insertFromPaste':

				editor.value = (
					editor.value.substring(0, doingState.selection.start) + lostData +
					editor.value.substring(doingState.selection.start + data.length)
				);
				editor.setSelectionRange(doingState.selection.start, doingState.selection.end + lostData.length);
				if (doingState.caret) editor.selectionStart = editor.selectionEnd;

				break;
			case 'insertText':

				if (!doingState.selection_length)
					editor.value = (
						editor.value.substring(0, doingState.selection.start) + (lostData || '') +
						editor.value.substring(doingState.selection.start + (data || '').length)  //  + !doingType
					);

				editor.setSelectionRange(
					doingState.selection.start + lostData.length,
					doingState.selection.end + lostData.length		  // + lostData.length * !!doingType
				);
				break;
			case 'deleteByCut': // either cut approach
			case 'deleteContentForward': // del on sel.len == 0
			case 'deleteContentBackward': // all other approaches to del
				editor.value = (
					editor.value.substring(0, doingState.selection.start) + (lostData || '') +
					editor.value.substring(doingState.selection.end + !!doingType * (data || '').length)
				);

				editor.selectionStart = editor.selectionEnd = (
					doingState.selection.start +
					(
						doingState.type == InputActionType.deleteContentBackward && (lostData || '').length == 1
					)
				);

				if ((lostData || '').length > 1) editor.selectionEnd = doingState.selection.start + lostData.length;

				break;
		}
	}









	const storeMultiactions = function (event, callback, onfinish, kwargs) {

		event.target.dispatchEvent(new KeyboardEvent('keydown'));

		let postOptions = callback(event);		 							// multiActions[event.key](event);

		let transfer = new DataTransfer();							// так для IE не будет работать
		transfer.setData('text/plain',
			event.target.value.slice(
				(kwargs || event.target).selectionStart, 
				event.target.selectionEnd  // or line.slice(1)
			)
		);
		let clipboardEvent = new ClipboardEvent('paste', { clipboardData: transfer });

		event.target.dispatchEvent(clipboardEvent);
		event.target.dispatchEvent(new InputEvent('input', {			// так для IE не будет работать 
			data: null,
			inputType: 'insertFromPaste'
		}));
		if (onfinish && postOptions && postOptions.backoffset !== undefined) onfinish(postOptions);
	};
	/**
	 * 
	 * @param {*} event 
	 * @param {Function} callback 
	 * @param {startLine: Number, endLine: Number} kwargs - позиция начала строки и конца строки 
	 */
	const storeAction = function (event, callback, kwargs) {

		// if (!kwargs) kwargs = {
		// 	// todo default behavior (now is draft!!)
		// 	startLine: editor.value.lastIndexOf('\n', editor.selectionStart-1),
		// 	endLine: Math.max(editor.value.indexOf('\n', editor.selectionEnd), editor.value.length)
		// }

		event.target.selectionStart = kwargs.startLine + 1;
		event.target.selectionEnd = kwargs.endLine;	

		event.target.dispatchEvent(new KeyboardEvent('keydown', {}));
		let preformat = callback(event);

		let transfer = new DataTransfer(); 					// так для IE не будет работать
		transfer.setData('text/plain', event.target.value.substr(kwargs.startLine + 1, preformat.line.length));
		let clipboardEvent = new ClipboardEvent('paste', { clipboardData: transfer });

		event.target.dispatchEvent(clipboardEvent);
		input.caret = 123;
		event.target.dispatchEvent(new InputEvent('input', {	// так для IE не будет работать 
			data: null,
			inputType: 'insertFromPaste'
		}));
		input.caret = undefined;

		return preformat;
	};


	const InputActionType =
	{
		insertFromPaste: 'insertFromPaste',					// get selection (keydown) and clipboardData (paste)
		deleteByCut: 'deleteByCut',							// get selection (keydown) 
		insertText: 'insertText',							// get data (input) and selection (keydown)
		deleteContentBackward: 'deleteContentBackward',		// get selection (keydown)
		deleteContentForward: 'deleteContentForward'		// get selection (keydown)
	};

	let storage = { undo: undoStorage, redo: redoStorage };
	const redo = (e) => {
		let redoState = redoStorage.pop();
		if (redoState) {
			undoStorage.push(redoState), debug && redoLog(storage);

			actionApply(redoState, 'redo');
			if (e.preventDefault) e.preventDefault();
		}

	};
	const undo = (e) => {
		if (e.shiftKey) return redo(e);

		let undoState = undoStorage.pop();
		if (undoState) {
			redoStorage.push(undoState), debug && redoLog(storage);

			actionApply(undoState, '');
			if (e.preventDefault) e.preventDefault();
			
		}
	};

	// @ts-nocheck


	function initialize() {
	  
	  // initialize editor for undo/redo emulator applying in debug mode (true option):
	  var editor = main(document.querySelector('textarea'), true);	
	  // on ctrl+z keydown event subscribe:
	  editor.onkeydown = (event) => { event.code === 'KeyZ' && event.ctrlKey && undo(event); };


	  document.querySelector('#add').onclick = (event) => {					  // first example stored by undo-mimic action 

	    let val = ' 123';    
	    editor.selectionStart = editor.selectionEnd = editor.value.length+1;    
	    storeAction({target: editor}, () => ({line: (() => { editor.value += val; return {line: val} })()}),{
	      startLine: editor.selectionStart-1,
	      endLine: editor.selectionEnd
	    });
	    editor.focus();
	  };

	  document.querySelector('#replace').onclick = (event) => {					// second example stored by undo-mimic action 

	    editor.selectionStart = 0, editor.selectionEnd = editor.value.length;
	    storeMultiactions({target: editor}, () => editor.value = '123 ', null, {selectionStart: 0});
	    editor.selectionStart = editor.selectionEnd = editor.value.length, editor.focus();
	  };  

	  return editor;

	}

	window.addEventListener('load', () => { const editor = initialize();

	  document.getElementById('undo_btn').onclick = () => {undo({shiftKey: false}); editor.focus();};
	  document.getElementById('redo_btn').onclick = () => { undo({shiftKey: true}); editor.focus();};
	});

}());
//# sourceMappingURL=undo-mimic.js.map
