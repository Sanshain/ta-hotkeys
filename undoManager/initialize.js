// @ts-nocheck

var redoLog = (() => { });
// redoLog = redoLog || (() => { });

var editor = document.getElementById('editor') || document.querySelector('textarea'),
	undoStorage = [],
	redoStorage = [];

export default function main(target) {
	editor = target;
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
		)
	}
	else {
		input.lostData = editor.value.slice(
			input.selection.start - 1,
			input.selection.end + 1
		)
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
		redoLog();
	}
	else redoLog(undoStorage);
});


export const input = {

	type: null,		// 'insertFromPaste' | 'deleteByCut' | 'insertText' | 'deleteContentBackward' | ...
	data: null,		//  inserted char by 'insertText' type
	lostData: null, //  data been selected on insert

	get selection_length() { return this.selection.end - this.selection.start },
	selection: {
		start: null,
		end: null
	},
}



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









export const storeMultiactions = function (event, callback, onfinish) {

	event.target.dispatchEvent(new KeyboardEvent('keydown'));

	let postOptions = callback(event);		 							// multiActions[event.key](event);

	let transfer = new DataTransfer();							// так для IE не будет работать
	transfer.setData('text/plain',
		event.target.value.slice(event.target.selectionStart, event.target.selectionEnd  // or line.slice(1)
	));
	let clipboardEvent = new ClipboardEvent('paste', { clipboardData: transfer })

	event.target.dispatchEvent(clipboardEvent);
	event.target.dispatchEvent(new InputEvent('input', {			// так для IE не будет работать 
		data: null,
		inputType: 'insertFromPaste'
	}));
	if (onfinish && postOptions && postOptions.backoffset !== undefined) onfinish(postOptions);
}
export const storeAction = function (event, callback, kwargs) {
	event.target.selectionStart = kwargs.startLine + 1;
	event.target.selectionEnd = kwargs.endLine;
	event.target.dispatchEvent(new KeyboardEvent('keydown', {}));

	let preformat = callback(event);

	let transfer = new DataTransfer(); 					// так для IE не будет работать
	transfer.setData('text/plain', event.target.value.substr(kwargs.startLine + 1, preformat.line.length));
	let clipboardEvent = new ClipboardEvent('paste', { clipboardData: transfer })

	event.target.dispatchEvent(clipboardEvent);
	input.caret = 123;
	event.target.dispatchEvent(new InputEvent('input', {	// так для IE не будет работать 
		data: null,
		inputType: 'insertFromPaste'
	}));
	input.caret = undefined;

	return preformat;
}


const InputActionType =
{
	insertFromPaste: 'insertFromPaste',					// get selection (keydown) and clipboardData (paste)
	deleteByCut: 'deleteByCut',							// get selection (keydown) 
	insertText: 'insertText',							// get data (input) and selection (keydown)
	deleteContentBackward: 'deleteContentBackward',		// get selection (keydown)
	deleteContentForward: 'deleteContentForward'		// get selection (keydown)
}


const redo = (e) => {
	let redoState = redoStorage.pop();
	if (redoState) {
		undoStorage.push(redoState), redoLog();

		actionApply(redoState, 'redo');
		e.preventDefault();
	}

}
export const undo = (e) => {
	if (e.shiftKey) return redo(e);

	let undoState = undoStorage.pop();
	if (undoState) {
		redoStorage.push(undoState), redoLog();

		actionApply(undoState, '');
		e.preventDefault();
	}
}