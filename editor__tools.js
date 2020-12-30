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


				// так для IE не будет работать 
				event.target.dispatchEvent(new KeyboardEvent('keydown'));
				// event.target.dispatchEvent(new InputEvent('input',{
				// 	data: event.target.value.slice(event.target.selectionStart, event.target.selectionEnd),
				// 	inputType: 'deleteContentBackward'
				// }));


				let startLine = event.target.value.substring(0, start - 1)
				line = !event.shiftKey ? line.replace(/\n/g, '\n	') : line.replace(/\n	/g, '\n');
				let endLine = event.target.value.substring(end);
				event.target.value = [startLine, line, endLine].join('');

				event.target.selectionStart = start;
				event.target.selectionEnd = end + len * (event.shiftKey ? -1 : 1);



				// так для IE не будет работать 
				let transfer = new DataTransfer();
				transfer.setData('text/plain', 
					event.target.value.slice(event.target.selectionStart, event.target.selectionEnd  // or line.slice(1)
				));
				let clipboardEvent = new ClipboardEvent('paste', {
					clipboardData: transfer
				})				

				// event.target.dispatchEvent(new KeyboardEvent('keydown'));
				event.target.dispatchEvent(clipboardEvent);
				event.target.dispatchEvent(new InputEvent('input',{
					data: null,
					inputType: 'insertFromPaste'
				}));



				// var pressTabKey = document.createEvent("KeyboardEvent");
				// pressTabKey.initKeyboardEvent("keypress", true, true, null, false, false, false, false, 9, 0);

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