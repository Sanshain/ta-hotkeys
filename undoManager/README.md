# undo-mimic
Emulating undo and redo actions for textarea and input page elements

## Installation

```
npm i Sanshain/undo-mimic
```

or use like cdn:

```html
<script src="https://sanshain.github.io/undo-mimic/demo/release/undo-mimic.js"></script>
```

## Simple usage

Usage as module via npm

```js
import { storeMultiactions, storeAction, undo } from "undo-mimic/initialize";
import main from 'undo-mimic/initialize';


function initialize() {
    
  var editor = main(document.querySelector('textarea'), true);	  			  // initialize editor for undo/redo emulator applying in debug mode (true option)
  editor.onkeydown = (event) => { event.code === 'KeyZ' && event.ctrlKey && undo(event) };// on ctrl+z keydown event subscribe


  document.querySelector('#add').onclick = (event) => {					  // first example stored by undo-mimic action 

    let val = ' 123';    
    editor.selectionStart = editor.selectionEnd = editor.value.length+1;    
    storeAction({target: editor}, () => ({line: (() => { editor.value += val; return {line: val} })()}),{
      startLine: editor.selectionStart-1,
      endLine: editor.selectionEnd
    });
    editor.focus();
  }

  document.querySelector('#replace').onclick = (event) => {					// second example stored by undo-mimic action 

    editor.selectionStart = 0, editor.selectionEnd = editor.value.length;
    storeMultiactions({target: editor}, () => editor.value = '123 ', null, {selectionStart: 0});
    editor.selectionStart = editor.selectionEnd = editor.value.length, editor.focus();
  }  

  return editor;

}

window.addEventListener('load', () => { const editor = initialize();

  document.getElementById('undo_btn').onclick = () => {undo({shiftKey: false}); editor.focus();}
  document.getElementById('redo_btn').onclick = () => {undo({shiftKey: true}); editor.focus();}
});
```

Look full example inside "Demo" folder, [github page](https://sanshain.github.io/undo-mimic/demo/). 

### Usage with [ta-hotkeys](https://github.com/Sanshain/ta-hotkeys):

```js
  document.querySelector('button').onclick = () => {
    	let caret = editor.selectionStart;						// remember caret position
	let preformat = storeAction(event, () => {					// rememeber action by undi-mimic
		var preformat = formatAction(line, event); // some actions
		editor.value = preLine + preformat.line + postLine;
		return preformat;
	}, {
		startLine: startLine, endLine: endLine
	})

	if (preformat.eventAbort) event.preventDefault();
	// selection turns back:
	editor.selectionStart = editor.selectionEnd = caret + preformat.offset * (preformat.undo ? -1 : 1);  
  }
```

## API:

- `main` - initialize editor element
- `undo` - undo action
- `storeAction` - store one line action inside callback
- `storeMultiactions` - store action inside callback for actions under selected multiline text

