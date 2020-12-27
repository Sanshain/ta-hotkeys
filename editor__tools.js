
const editor = document.getElementById('editor');

editor.addEventListener('input', event => {
	console.log(event);		
	// || (insertFromPaste | deleteByCut) || insertText || (deleteContentBackward | deleteContentForward)

	console.log({
		inputType: event.inputType,
		data: event.data,
		start: event.target.selectionStart,			// ловить на paste/cut либо на keydown 
		end: event.target.selectionEnd,				// ловить 
	})
	// event.inputType
	// event.data	
});
editor.addEventListener('paste', e => {
	
	console.log(e.target.selectionStart)
	console.log(e.target.selectionEnd)
	// console.log(window.clipboardData || e.clipboardData);
	// console.log(e.clipboardData.getData('text/plain'))
	// e.preventDefault();
});
editor.addEventListener('cut', e => {});

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

	undo(){

	},
	autoSave(){
		// save to sessionStorage on overflow
	}
};


let multiAction = {
	'-': (e, target) => {

		target = target || editor || e.target;
		let value = '- ',
			 start = target.selectionStart,
			 end = target.selectionEnd;


		let line = target.value.substring(start - 1, end);
		let len = (line.split('\n').length - 1) * value.length,
			 undo = line.startsWith('\n' + value);
		if (len === 0) format_text(e);
		else{
							
			let startLine = target.value.substring(0, start-1)				
			line = !undo 
				? line.replace(new RegExp('\n', 'g'), '\n' + value) 
				: line.replace(new RegExp('\n' + value, 'g'), '\n');
			
			target.value = [startLine, line, target.value.substring(end)].join('');

			// target.setSelectionRange(start, end + len * (e.shiftKey ? -1 : 1));
			target.selectionStart = start;
			target.selectionEnd = end + len * (undo ? -1 : 1);
		}
		e.preventDefault();		
	}
}


function preformat(event) {

	// console.log(event);
	if (event.ctrlKey) event.code != 'KeyZ' ? format_text(event) : alert('todo');
	else if (event.key.toLowerCase() === 'tab'){
		
		// определим, выделен ли текст
		let start = event.target.selectionStart;
		let end = event.target.selectionEnd;
		if (end - start > 0) {
			
			let line = event.target.value.substring(start-1, end);
			let len = line.split('\n').length - 1;
			if (len === 0) format_text(event);
			else{
								
				let startLine = event.target.value.substring(0, start-1)				
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


function format_text(event) {	


	let caret = null || 0;


	// получаем позицию курсора
	if (editor.selectionStart !== undefined) {
		if (editor.selectionStart < editor.selectionEnd){
			event.key = event.key || event.target.getAttribute('data-key');
			if (multiAction[event.key]){

				multiAction[event.key](event);
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

	var formatAction = actions[event && (event.key || (event.target.tagName.toLowerCase() === 'button' ? '/' : undefined))];
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