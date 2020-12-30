// @ts-ignore

const redo = (e) => {
	let redoState = redoStorage.pop();
	if (redoState) {
		undoStorage.push(redoState);
		switch (redoState.type) {
			case 'insertText':
				// @ts-ignore
				editor.value = (
					// @ts-ignore
					editor.value.slice(0, redoState.selection.start) + redoState.data +
					// @ts-ignore
					editor.value.slice(redoState.selection.end + redoState.lostData.length)
				)
				// @ts-ignore
				editor.selectionStart = editor.selectionEnd = redoState.selection.end + 1;
				break;
			case 'deleteByCut':							// either cut approach
			case 'deleteContentForward':				// del on sel.len == 0
			case 'deleteContentBackward':				// all other approaches to del


				break;

			case 'insertFromPaste':

				// @ts-ignore
				editor.value = (
					// @ts-ignore
					editor.value.substring(0, redoState.selection.start) + redoState.data +
					// @ts-ignore
					editor.value.substring(redoState.selection.start + redoState.lostData.length)
				);

				// @ts-ignore
				editor.selectionStart = editor.selectionEnd = redoState.selection.start + redoState.data.length;
				break;
		}
	}
	// @ts-ignore
	redoLog();
}