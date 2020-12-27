var actionsMacro = {

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