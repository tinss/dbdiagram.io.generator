const request = require('request')
const fs = require("fs")
const path = require("path")
const pluralize = require('pluralize')

const regAllTables = /table[ ]+([a-z0-9_]+)[ ]*[{]{1}([^}]+)[}]{1}/gmi
const regAllColumns = /^[ ]*([a-zA-Z0-9_]+)[ ]+([a-zA-Z]+)\(?[0-9]*\)?([ ]+(pk)?([ ]?\[?([^\]]+)\]?)?)?/gmi
const regRef = /ref:[ ]*\>[ ]*([a-z0-9_-]+)\.([a-z0-9_-]+)/gmi
const regEmptyLine = /^\s*$(?:[\r\n]{2,}|[\n]{2,})/gm

const parseDbdiagram = function(schemas){
  let tables = [];
  match = regAllTables.exec(schemas)
  while (match != null) {
    if(match[1]){
      let table = {name: match[1], 
                   camelName: match[1].replace(/./,x=>x.toLowerCase()), 
                   pluralName: pluralize(match[1]),
                   columns: []}
      if(match[2]){
        //console.log(match[2])
        matchCols = regAllColumns.exec(match[2])
        while (matchCols != null) {
          //console.log(matchCols);
          //1: column name
          //2: type
          //4: is pk
          //6: options
          let col = {
            name: matchCols[1],
            type: matchCols[2],
            pk: matchCols.length >= 5 ? matchCols[4] : false
          };
          if(matchCols.length >= 7 && matchCols[6]){
            let options = matchCols[6].split(',')
            for(let index in options){
              let opt = options[index].trim();
              if(opt == 'not null'){
                col.notnull = true
              }else if(opt == 'increment'){
                col.increment = true
              }else{
                let tmp = /ref:[ ]*\>[ ]*([a-z0-9_-]+)\.([a-z0-9_-]+)/gmi.exec(opt)
                if(tmp != null){
                  col.refTable = tmp[1]
                  col.refCol = tmp[2]

                  if(col.refTable == table.name){
                    col.refTableName = 'Parent'
                  }else{
                    col.refTableName = col.refTable
                  }
                }
              }
            }
          }
          table.columns.push(col)
          matchCols = regAllColumns.exec(match[2])
        }
      }

      tables.push(table)
    }
    match = regAllTables.exec(schemas)
  }
  
  //console.log(tables)
  return tables
};

const removeEmptyLines = function(text, endLineChar){
	return text.replace(regEmptyLine, endLineChar)
}

const getSchemasFromId = function(id, callback){
	let url = 'https://api.dbdiagram.io/query/' + id
    let body = '';
    request
        .get({
        	url:url
        })
        .on('data', function (data){
            body += data;
        })
        .on('end', function(){
            try {
                out = JSON.parse(body);
                callback(out.content);
            } catch (err) {
                console.log(err);
                callback(err);
            }
        })
        .on('error', function(err){
            console.log(err);
            callback(err);
        });
}

exports.parseDbdiagram = parseDbdiagram
exports.removeEmptyLines = removeEmptyLines
exports.getSchemasFromId = getSchemasFromId