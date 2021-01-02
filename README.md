# ta-hotkeys

### Textarea with hot keys 

A package designed to extend the functionality of textarea using hotkeys. Provides a powerfull and lightweight API for creating and configuring hotkeys. 

### Demo

You can see an example of the work [here](https://sanshain.github.io/ta-hotkeys/)

### Get started

Explore the following example:

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

	for (let i = 0; i < 7; i++) editor.value += `line ${i+1}\n`;			
	editor.focus();
});
```

for html page: 

```html
<textarea name="" id="editor" rows="10"></textarea>
<button data-key='/' id='center__alignment'>click here</button>
<script src="./__release__/hotkeys.js"></script>
```

### Installation

- Use the script tag with the attribute src: `<script src="./hotkeys.js"></script>`
- install as npm package `npm i Sanshain/ta-hotkeys` (in drafting)(only for module branch)
- use `git clone https://github.com/Sanshain/ta-hotkeys.git` and independently build it via rollup (only for module branch)

