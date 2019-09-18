const lib = require('./../lib')
const fs = require('fs')
const dot = require('dot')

dot.templateSettings.strip = false
dot.templateSettings.append = true

var myArgs = process.argv.slice(2);

lib.getSchemasFromId(myArgs[0], function(schemas){
	console.log(schemas)
	let tables = lib.parseDbdiagram(schemas)
	const modelTemplate = fs.readFileSync('./csharp/model.template', 'utf8')
	const modelTemplateFunc = dot.template(modelTemplate);
	const typesConverter = {
		'varchar': 'string',
		'longtext': 'string',
		'bit': 'bool',
		'datetime': 'DateTime',
		'date': 'DateTime',
		'time': 'DateTime',
	}
	const nullAbleTypes = ['int', 'decimal', 'bool']

	for(let tableName in tables){

		for(let colIndex in tables[tableName].columns){
			let col = tables[tableName].columns[colIndex]
			if(typesConverter[col.type]){
				col.type = typesConverter[col.type]
			}

			if (!col.notnull && nullAbleTypes.indexOf(col.type) != -1){
				col.type = col.type + '?'
			}
		}

		let result = modelTemplateFunc({tableName: tableName, columns: tables[tableName].columns})

		result = lib.removeEmptyLines(result, "\r\n")

		fs.writeFile("./csharp/results/" + tableName + ".cs", result, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		}); 
	}
})

