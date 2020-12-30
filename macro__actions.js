var actionsMacro = {

	tag_in (value, line) { 
		let res = this.begin_end(['<'+value+'>', '</'+value+'>'], line); 
		res.offset += res.offset + 1;
		return res;
	},

	
	begin_end:  (value, line) => {

		let start = value[0],
			end = value[1];		
		const regex = new RegExp(start + '([\\s\\S]*?)' + end);
		const undoFlag = line.match(regex);

		return {
			line: undoFlag ? line.replace(regex, '$1') : start + line + end,
			offset: start.length,
			undo: undoFlag
		}		
	},
	begin: (value, line, event) => {
		// let value = '# '
		// const undoFlag = new RegExp('^' + value + '[\\s\\S]+?$').exec(line);
		// const undoFlag= line.match(/^# [\S\s]+?$/);	// regex.exec(line);
		// const regex = new RegExp('^' + value + '([\\s\\S]+?)$').compile(); # err

		const regex = new RegExp('^' + value + '([\\s\\S]+?)$');
		let undoFlag = !event ? regex.exec(line) : event.shiftKey;		
		return {
			// line: undoFlag ? line.replace(/# ([\s\S]*?)/, '$1') : value + line,
			line: undoFlag ? line.replace(regex, '$1') : value + line,
			offset: value.length,
			undo: undoFlag,
			eventAbort: true
		}
	},			
	// get(){console.log(this)},
}


var multiMacro = {


	begin: (value, e, target) => {

		let start = target.selectionStart,
			end = target.selectionEnd;

		let line = target.value.substring(start - 1, end);
		let len = (line.split('\n').length - 1) * value.length,
			undo = line.startsWith('\n' + value);

		if (len === 0) format_text(e);			
		else {
	
			let startLine = target.value.substring(0, start - 1);
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