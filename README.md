# ta-hotkeys

### Textarea with hot keys 

A package designed to extend the functionality of textarea using hotkeys. Provides a powerfull and lightweight API for creating and configuring hotkeys. Explore the following example:

```js
window.addEventListener('load', () => {

	hokInit(document.getElementById('editor'), {
		actions: Object.assign(hokInit.actionsMacro, { 
			'-': (line) => actions.begin('# ', line),
			'Tab': (line, event) => actions.begin('	', line, event),				
			'*': (line) => actions.begin_end(['```\n', '\n```'], line),
			'/': (line) => actions.tag_in('center', line),

		}),
		multiActions: Object.assign(hokInit.multiMacro,{
			'-': (e, target) => multiActions.begin('- ', e, target || editor || e.target),
			'*': (e, target) => multiActions.begin_end(['```\n', '\n```'], e, target || editor || e.target)
		})
	},[ document.getElementById('center__alignment') ])

	editor.focus();
});
```

for html page: 

```
<textarea name="" id="editor" rows="10"></textarea>
<button data-key='/' id='center__alignment'>click here</button>
<script src="./__release__/hotkeys.js"></script>
```

