// @ts-nocheck

import { storeMultiactions, storeAction, undo } from "./undoManager/initialize";
import main from './undoManager/initialize';
import { actionsMacro, multiMacro, finalPosition, buffer } from "./macro__actions";

var editor = null,
	multiActions = {},
	actions = {};

export default function initialize(target, keys, panel) {

	main(editor = target || document.querySelector('textarea'));
	if (!(target instanceof HTMLTextAreaElement)) throw new Error('editor with hot keys needs textarea on the page');

	editor.addEventListener('keydown', preformat);
	if (keys instanceof Object) {

		if ('actions' in keys && keys.actions instanceof Object) {
			actions = keys.actions;					// actions.__proto__ = actionsMacro;			
		}
		if ('multiActions' in keys && keys.multiActions instanceof Object) {
			multiActions = keys.multiActions;		// multiActions.__proto__ = multiMacro;		
		}
	}

	if (panel instanceof HTMLElement) panel = [].slice.apply(panel.querySelectorAll(`.${panel.className}>*`));
	if (Array.isArray(panel)) {
		panel.forEach(btn => btn.addEventListener('onclick', format_text));
	}

	editor.addEventListener('paste', e => {
		
		// if (!e.isTrusted) return;		
		e.isTrusted && (buffer.paste || (() => { }))(e, e.clipboardData.getData('text/plain'));
	});
}

initialize.actionsMacro = actionsMacro;
initialize.multiMacro = multiMacro;
initialize.finalPosition = finalPosition;

/**
 * в отличие от format_text(e)  
 * - триггерится только на текстареа (через нажатие горячих клавиш)
 * - обрабатывает случаи для таб
 * @param {*} event 
 */
function preformat(event) {

	console.log(event);
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
	fake = fake || event.target.getAttribute('data-key')

	// получаем позицию курсора
	if (editor.selectionStart !== undefined) {
		if (editor.selectionStart < editor.selectionEnd) {
			if (editor.value.slice(editor.selectionStart, editor.selectionEnd).split('\n').length > 1) {
				event.key = event.key || event.target.getAttribute('data-key');
				if (multiActions[event.key] || multiActions[event.code]) {

					event.target.dispatchEvent(new KeyboardEvent('keydown'));

					return storeMultiactions(event,
						() => (multiActions[event.key] || multiActions[event.code])(event),
						// o => editor.selectionStart = editor.selectionEnd-=o.backoffset
					);
				}
			}
			else {
				// if(middlelineActions[event.key](event)) return; - // todo				
				// замена посреди строки (для ссылок и курсивного текста, например)

				if (multiActions[event.key] || multiActions[event.code]) {

					if (editor.selectionStart+1 < editor.selectionEnd){
						if (editor.value[editor.selectionEnd-1] === ' ') editor.selectionEnd--;
					}
					event.target.dispatchEvent(new KeyboardEvent('keydown'));
					(multiActions[event.key] || multiActions[event.code])(event);


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
	if (!event.key) event = { target: editor };						 // для кнопки нужно подменить target
	if (formatAction) {

		let preformat = storeAction(event, () => {
			var preformat = formatAction(line, event);
			editor.value = preLine + preformat.line + postLine;
			return preformat;
		}, {
			startLine: startLine, endLine: endLine
		})

		if (preformat.eventAbort) event.preventDefault();
		// возвращаем выделение
		editor.selectionStart = editor.selectionEnd = caret + preformat.offset * (preformat.undo ? -1 : 1);

	}
	else {
		return;
	}

	editor.focus();

}