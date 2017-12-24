var mapTool = require('../src/borderline')
var fs = require('fs')
var fc = JSON.parse(fs.readFileSync('../json/guizhou.json',{encoding:"utf8"}));
var test = JSON.parse(fs.readFileSync('../json/newArea.json',{encoding:"utf8"}));
var result = mapTool.getNewGeo(fc,test)
fs.writeFileSync('../out2.json',JSON.stringify(result),{encoding:"utf8"});
