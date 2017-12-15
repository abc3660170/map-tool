var fs = require('fs');
var turf = require('@turf/turf');
var testGeo = {
    "type": "Feature",
    "properties": {},
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    106.0455322265625,
                    26.382027976025352
                ],
                [
                    106.19384765625,
                    26.33280692289788
                ],
                [
                    106.4959716796875,
                    26.480407161007275
                ],
                [
                    106.41357421875,
                    26.696545111585152
                ],
                [
                    106.20483398437499,
                    26.539394329017032
                ],
                [
                    106.0455322265625,
                    26.382027976025352
                ]
            ]
        ]
    }
}
var fc = JSON.parse(fs.readFileSync('./json/guizhou.json',{encoding:"utf8"}));
var testGeoLine = turf.polygonToLine(testGeo);
if(!fc.features || fc.features.length === 0) throw new Error("unvalid features!");
for(var multippolygon = fc.features,i =  1; i < multippolygon.length; i++ ){
    if(booleanOverlap.call(null,multippolygon[i],testGeo)){
        /* 目标polygon和 互相切割成成线段*/
        var targetLines = [];
        var geolines = [];
        var multiLineString = turf.polygonToLine(multippolygon[i])
        if(multiLineString.features){
            // multiploygon 的转换的多条线
            multiLineString.features.forEach(function(lineString){
                var shit = turf.lineIntersect(lineString,testGeoLine)
                if(turf.lineIntersect(lineString,testGeoLine).features.length !== 0){
                    targetLines = turf.lineSplit(lineString,testGeoLine).features
                    geolines = turf.lineSplit(testGeoLine,lineString).features
                    linkPolygon(multippolygon[i],testGeo,targetLines,geolines)
                }

            })
        }else{
            // ploygon 的转换的单条线
            targetLines.push(turf.lineSplit(multiLineString,testGeoLine))
        }

    }
}

/**
 * 返回不在切割区域内的线
 * @param testGeo
 * @param mainLines
 * @returns {Array}
 */
function dropCoveredLines(testGeo,mainLines){
    var filterLines = []
    mainLines.forEach(function(line){
        if(!turf.booleanContains(testGeo,line)){
            filterLines.push(line)
        }
    })
    return filterLines;
}

/**
 * 把切断的线重新连接到和之前不相交的多边形线
 * @param mainF
 * @param testF
 * @param mainLines
 * @param cutLines
 * @returns {*}
 */
function linkPolygon(mainF,testF,mainLines,cutLines){
   var mainLines = dropCoveredLines(testF,mainLines)
    mainLines.forEach(function (line) {
        cutLines.forEach(function(cutline){
            var nextPoint = turf.point(cutline.geometry.coordinates[1]);
            if( turf.booleanContains(mainF,nextPoint) && booleanLineLinked(line,cutline)){
                var lineArray = line.geometry.coordinates[0];
                var cutlineArray = cutline.geometry.coordinates[0];
                // 这条切割线被切割图形内部
                if(lineArray[0] == cutlineArray[0]){
                    cutlineArray.reverse();
                }
                cutlineArray.pop();
                lineArray.concat(cutlineArray)
            }
        })
    })
    return mainLines;
}

function booleanLineLinked(line1,line2){
    var line1StartPoint =  line1.geometry.coordinates[0][1];
    var line1EndPoint =  line1.geometry.coordinates[0][line1.geometry.coordinates[0].length - 1];
    var line2StartPoint =  line2.geometry.coordinates[0][1];
    var line2EndPoint =  line2.geometry.coordinates[0][line2.geometry.coordinates[0].length - 1];
    if((line1StartPoint == line2StartPoint && line1EndPoint == line2EndPoint) || (line1StartPoint == line2EndPoint && line1EndPoint == line2StartPoint)){
        return true;
    }
    return false;
}

/**
 * if multiPolygon and polygon
 * @param multiPolygon : targets
 * @param polygon :  targets
 * @returns {boolean}
 */
function booleanOverlap(multiPolygon,polygon){
    if(multiPolygon.geometry.type === 'MultiPolygon'){
        // transform MultiPolygon to simply polygons
        var polygonCollection = turf.flatten(multiPolygon)
        for(var j = 0, polygons = polygonCollection.features ; j < polygons.length; j++){
            if(turf.booleanOverlap(polygons[j],polygon)){
                return true;
            }
        }
        return false
    }else if(multiPolygon.geometry.type === 'Polygon'){
        if(turf.booleanOverlap(multiPolygon,polygon)){
            return true;
        }
        return false;
    }else{
        throw new Error("target must be MultiPolygon or Polygon")
    }
}



/**
 * boolean Polygon
 * @param ploygon
 * @returns {boolean}
 */
function isMPolygon(ploygon){
    if(ploygon.geometry && ploygon.geometry.type === 'Polygon'){
        return true;
    }else{
        return false;
    }
}


/**
 * boolean MultiPolygon
 * @param ploygon
 * @returns {boolean}
 */
function isMultiPolygon(ploygon){
    if(ploygon.geometry && ploygon.geometry.type === 'MultiPolygon'){
        return true;
    }else{
        return false;
    }
}






