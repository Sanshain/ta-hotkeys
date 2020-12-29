// @ts-nocheck

// redoLog = (() => { });
redoLog = redoLog || (() => { });

const editor = document.getElementById('editor');
editor.addEventListener('keydown', function (event) {

	input.selection = {
		start: event.target.selectionStart,
		end: event.target.selectionEnd,
	};

	if (input.selection.length) input.lostData = editor.value.slice(
		input.selection.start,
		input.selection.end
	)
	else input.lostData = editor.value.slice(
		input.selection.start - 1,
		input.selection.end + 1
	)

});
editor.addEventListener('paste', e => {

	input.data = (window.clipboardData || e.clipboardData).getData('text/plain');
	// если вызвано из контекстного меню, то выделение надо ловить в контекстном меню

});
editor.addEventListener('input', event => {			// event.inputType && event.data	

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

		input.lostData = input.lostData.slice(1, -1);
		input.selection.end = input.selection.start + ((input.selection.data || {}).length || 0);


		// 	// input.selection.end = input.selection.end - input.lostData.length; // ?
		// }
		// else{ // deleteContentBackward | deleteContentForward // !

		// }
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

const undoStorage = [];
const redoStorage = [];

const redo = (e) => {
	let redoState = redoStorage.pop();
	if (redoState) {
		undoStorage.push(redoState), redoLog();
		
		actionApply(redoState, 'redo');
		e.preventDefault();
	}
	
}
const undo = (e) => {
	if (e.shiftKey) return redo(e);

	let undoState = undoStorage.pop();
	if (undoState) {
		redoStorage.push(undoState), redoLog();

		actionApply(undoState, '');
		e.preventDefault();
	}
}
const input = {

	type: null,		// 'insertFromPaste' | 'deleteByCut' | 'insertText' | 'deleteContentBackward' | ...
	data: null,		//  inserted char by 'insertText' type
	lostData: null, //  data been selected on insert

	get selection_length() { return this.selection.end - this.selection.start },
	selection: {
		start: null,
		end: null
	},
}

// const InputTypeAction =
// {
// 	insertFromPaste: e => {
// 		undoStorage.push(Object.assign({}, input))
// 		// undoStorage.push(JSON.parse(JSON.stringify(input)))
// 	},
// 	deleteByCut: e => undoStorage.push(JSON.parse(JSON.stringify(input))),
// 	insertText: e => undoStorage.push(JSON.parse(JSON.stringify(input))),
// 	deleteContentBackward: e => undoStorage.push(JSON.parse(JSON.stringify(input))),
// 	deleteContentForward: e => undoStorage.push(JSON.parse(JSON.stringify(input))),
// }


const InputActionType =
{
	insertFromPaste: 'insertFromPaste',					// get selection (keydown) and clipboardData (paste)
	deleteByCut: 'deleteByCut',							// get selection (keydown) 
	insertText: 'insertText',							// get data (input) and selection (keydown)
	deleteContentBackward: 'deleteContentBackward',		// get selection (keydown)
	deleteContentForward: 'deleteContentForward'		// get selection (keydown)
}


const state = {
	storageLimit: 20,							// count elements
	smartStorageLimit: 500,					// kb size
	storageSaveOn: '',							// on 'timeDebounce|enterKey'

	undoStorage: [{
		value: editor.value,
		state: {
			start: editor.selectionStart,
			end: editor.selectionEnd
		}
	}],

	undo() {

	},
	autoSave() {
		// save to sessionStorage on overflow
	}
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

			break;
		case 'insertText':

			if (!doingState.selection_length)
				editor.value = (
					editor.value.substring(0, doingState.selection.start) + (lostData || '') +
					editor.value.substring(doingState.selection.start + 1)
				);

			editor.setSelectionRange(
				doingState.selection.start, doingState.selection.end + lostData.length
			);
			break;
		case 'deleteByCut': // either cut approach
		case 'deleteContentForward': // del on sel.len == 0
		case 'deleteContentBackward': // all other approaches to del
			editor.value = (
				editor.value.substring(0, doingState.selection.start) + lostData +
				editor.value.substring(doingState.selection.end)
			);

			editor.selectionStart = editor.selectionEnd = (
				doingState.selection.start +
				(
					doingState.type == InputActionType.deleteContentBackward && lostData.length <= 1
				)
			);

			if (lostData.length > 1) {
				editor.selectionEnd = selection.start + lostData.length;
			}
			break;
	}	
}

/**
 * в отличие от format_text(e) 
 * - обрабатывает случаи для таб
 * - триггерится только нажатием горячих клавиш по текстареа
 * 
 * @param {*} event 
 */
function preformat(event) {

	// console.log(event);
	if (event.ctrlKey) event.code != 'KeyZ' ? format_text(event) : undo(event);
	else if (event.key.toLowerCase() === 'tab') {

		// определим, выделен ли текст
		let start = event.target.selectionStart;
		let end = event.target.selectionEnd;
		if (end - start > 0) {

			let line = event.target.value.substring(start - 1, end);
			let len = line.split('\n').length - 1;
			if (len === 0) format_text(event);
			else {

				let startLine = event.target.value.substring(0, start - 1)
				line = !event.shiftKey ? line.replace(/\n/g, '\n	') : line.replace(/\n	/g, '\n');
				let endLine = event.target.value.substring(end);
				event.target.value = [startLine, line, endLine].join('');

				event.target.selectionStart = start;
				event.target.selectionEnd = end + len * (event.shiftKey ? -1 : 1);
			}
			event.preventDefault();
		}
		else format_text(event);
	}
}

/**
 * форматирует выделенный фрагмент или строку, в которой находится каретка в текущий момент, 
 * в соответствии с заданными правилами (actions и multiActions соответственно)
 * @param {*} event 
 * @param {*} fake - эмуляция нажатого символа (опционально) для событий, не передающих нажатие клавиш (e.key)
 */
function format_text(event, fake) {


	let caret = null || 0;


	// получаем позицию курсора
	if (editor.selectionStart !== undefined) {
		if (editor.selectionStart < editor.selectionEnd) {
			event.key = event.key || event.target.getAttribute('data-key');
			if (multiActions[event.key]) {

				multiActions[event.key](event);
				return;
			}
		}
		caret = editor.selectionStart;
	}
	else alert('The browser not supports hot keys');				// polyfill is required


	// получаем позицию начала строки
	let startLine = (editor.value.lastIndexOf('\n', caret - 1));
	if (startLine < 0) startLine = 0;


	// получаем позицию конца строки
	let endLine = (editor.value.indexOf('\n', caret));
	if (endLine < 0) endLine = editor.value.length;


	// получаем текст:
	let preLine = editor.value.substr(0, startLine ? startLine + 1 : startLine);
	let line = editor.value.substring(startLine ? startLine + 1 : startLine, endLine);
	let postLine = editor.value.substr(endLine);

	// actions.get(event && (event.key || (event.target.tagName.toLowerCase() === 'button' ? '/' : undefined)))

	var formatAction = actions[event && (event.key || fake)];
	if (formatAction) var preformat = formatAction(line, event);
	else {
		return;
	}

	// заменяем текст
	editor.value = preLine + preformat.line + postLine;

	// возвращаем выделение
	editor.selectionStart = editor.selectionEnd = caret + preformat.offset * (preformat.undo ? -1 : 1);
	editor.focus();

	if (preformat.eventAbort) event.preventDefault();

}