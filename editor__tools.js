// @ts-nocheck

/**
 * в отличие от format_text(e)  
 * - триггерится только на текстареа (через нажатие горячих клавиш)
 * - обрабатывает случаи для таб
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
				
				storeMultiactions(event, () => {

					let startLine = event.target.value.substring(0, start - 1)
					line = !event.shiftKey ? line.replace(/\n/g, '\n	') : line.replace(/\n	/g, '\n');
					let endLine = event.target.value.substring(end);
					event.target.value = [startLine, line, endLine].join('');
	
					event.target.selectionStart = start;
					event.target.selectionEnd = end + len * (event.shiftKey ? -1 : 1);

				})

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
			if (editor.value.slice(editor.selectionStart, editor.selectionEnd).split('\n').length > 1) {
				event.key = event.key || event.target.getAttribute('data-key');
				if (multiActions[event.key]) {
	
					event.target.dispatchEvent(new KeyboardEvent('keydown'));
	
					storeMultiactions(event, () => multiActions[event.key](event));
	
					return;
				}
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


	// !todo undoMaager binding:
	var formatAction = actions[event && (event.key || fake)];
	if (formatAction) {

		event.target.selectionStart = startLine + 1;
		event.target.selectionEnd = endLine;
		event.target.dispatchEvent(new KeyboardEvent('keydown', {}));		


		var preformat = formatAction(line, event);
		// заменяем текст
		editor.value = preLine + preformat.line + postLine;


		let transfer = new DataTransfer(); 					// так для IE не будет работать
		transfer.setData('text/plain', event.target.value.substr(startLine + 1, preformat.line.length));
		let clipboardEvent = new ClipboardEvent('paste', { clipboardData: transfer })
	
		event.target.dispatchEvent(clipboardEvent);
		input.caret = 123;
		event.target.dispatchEvent(new InputEvent('input',{	// так для IE не будет работать 
			data: null,
			inputType: 'insertFromPaste'
		}));	
		input.caret = undefined;

		// возвращаем выделение
		editor.selectionStart = editor.selectionEnd = caret + preformat.offset * (preformat.undo ? -1 : 1);				

	}
	else {
		return;
	}

	editor.focus();

	if (preformat.eventAbort) event.preventDefault();

}