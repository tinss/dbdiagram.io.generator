const lib = require('./../lib')
const fs = require('fs-extra')
const dot = require('dot')
const eol = require('eol')

dot.templateSettings.strip = false
dot.templateSettings.append = true

let myArgs = process.argv.slice(2);
let projectName = myArgs[0]
let dbid = myArgs[1]

let path = './csharp/'+myArgs[0]+'/'

const typesConverter = {
	'varchar': 'string',
	'longtext': 'string',
	'bit': 'bool',
	'datetime': 'DateTime',
	'date': 'DateTime',
	'time': 'DateTime',
}
const nullAbleTypes = ['int', 'decimal', 'bool']

const preProcess = function(text){
	text = lib.removeEmptyLines(text, "\r\n")
	text = eol.crlf(text)
	return text
}

const loopTables = function(id, tables, tplfunc, fileNamefunc){
	for(let tableIndex in tables){
		const table = tables[tableIndex]
		for(let colIndex in table.columns){
			let col = table.columns[colIndex]
			if(typesConverter[col.type]){
				col.type = typesConverter[col.type]
			}

			if (!col.notnull && nullAbleTypes.indexOf(col.type) != -1){
				col.type = col.type + '?'
			}
		}

		let result = tplfunc({id: projectName, tableName: table.name, tableCamelName: table.camelName, 
			              columns: table.columns})
		result = preProcess(result)
		let fileName = fileNamefunc({tableName: table.name})
		fs.outputFile(path + fileName, result, function(err) {
		    if(err) {
		        return console.log(err)
		    }
		}); 
	}
}

lib.getSchemasFromId(dbid, function(schemas){
	//console.log(schemas)
	let tables = lib.parseDbdiagram(schemas)

	const config = JSON.parse(fs.readFileSync(path + 'config.json', 'utf8'))

	fs.removeSync(path + 'results/')

	for(let tplIndex in config.templates){
		const tpl = config.templates[tplIndex]
		const tplfunc = dot.template(fs.readFileSync(path + tpl.file, 'utf8'));
		const fileNamefunc = dot.template(tpl.file_name)
		if(tpl.is_multiple == true){
			loopTables(projectName, tables, tplfunc, fileNamefunc)
		}else{
			const tplData = {id: projectName, tables: tables}
			let result = tplfunc(tplData)
			result = preProcess(result)
			fs.outputFile(path + tpl.file_name, result, function(err) {
			    if(err) {
			        return console.log(err)
			    }
			});
		}
	}
})

