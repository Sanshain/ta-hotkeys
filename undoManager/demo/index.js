// @ts-nocheck

import { storeMultiactions, storeAction, undo } from "undo-mimic/initialize";
import main from 'undo-mimic/initialize';


function initialize() {
  
  // initialize editor for undo/redo emulator applying in debug mode (true option):
  var editor = main(document.querySelector('textarea'), true);	
  // on ctrl+z keydown event subscribe:
  editor.onkeydown = (event) => { event.code === 'KeyZ' && event.ctrlKey && undo(event) };


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
  document.getElementById('redo_btn').onclick = () => { undo({shiftKey: true}); editor.focus();}
});
