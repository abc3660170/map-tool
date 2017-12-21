var express = require('express');
var router = express.Router();
var multer  = require('multer')
var path = require('path')
var mapTool = require("../src/borderline.js");
var fs = require('fs');
var uuid = require('uuid/v1');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});
var upload = multer({ dest: 'uploads/' })
router.post('/postOriginFile',upload.single('originFile'), function(req, res, next) {
    res.render('index', { originFile: req.file.filename });
});
router.post('/postTestFile',upload.single('testFile'), function(req, res, next) {
    res.render('index', { testFile: req.file.filename,originFile: req.body.originFileName });
});

router.post('/viewMap', function(req, res, next) {
    var newMapName = uuid()+".json"
    if(generateMap.call(null,req.body.originFileName,req.body.testFileName,newMapName))
        res.send(newMapName)
});

function generateMap(OriginFilename,testFilename,fileName) {
    var originFile = JSON.parse(fs.readFileSync("./uploads/"+OriginFilename,{encode:"utf-8"}));
    var testFile = JSON.parse(fs.readFileSync("./uploads/"+testFilename,{encode:"utf-8"}));
    var newGeo = mapTool.getNewGeo(originFile,testFile)
    var data  = JSON.stringify(newGeo)
    fs.writeFileSync("./uploads/"+fileName,data,{encoding:"utf8"});
    return true;
}

module.exports = router;