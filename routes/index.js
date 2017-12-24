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
    var originGeoObject = JSON.parse(req.body.originGeo)
    var testGeoObject = JSON.parse(req.body.testGeo)
    if(testGeoObject.features){
       var polygon = testGeoObject.features[0]
    }else{
       var polygon = testGeoObject
    }
    var newFeatures = generateMap.call(null,originGeoObject,polygon)
    res.send(newFeatures)
});

function generateMap(OriginFeatures,testFeature) {
    return mapTool.getNewGeo(OriginFeatures,testFeature)
}

module.exports = router;