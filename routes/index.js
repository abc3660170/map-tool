var express = require('express');
var router = express.Router();
var multer  = require('multer')

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

module.exports = router;