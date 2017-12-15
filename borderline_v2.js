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
for(var multippolygon = fc.features,i =  0; i < multippolygon.length; i++ ){
    if(booleanOverlap.call(null,multippolygon[i],testGeo)){
        /* 目标polygon和 互相切割成成线段*/
        var targetLines = [];
        var geolines = [];
        var multiLineString = turf.polygonToLine(multippolygon[i])
        if(multiLineString.features){
            // multiploygon 的转换的多条线
            multiLineString.features.forEach(function(lineString){
                targetLines.push(turf.lineSplit(lineString,testGeoLine))
                geolines.push(turf.lineSplit(testGeoLine,lineString))

            })
        }else{
            // ploygon 的转换的单条线
            targetLines.push(turf.lineSplit(multiLineString,testGeoLine))
        }

    }
}
function dropCoveredLines(lineString){

}

function linkPolygon(mainLines,cutLines){
    var mainLines = dropCoveredLines(mainLines)
    mainLines.forEach(function (line) {
        cutLines.forEach(function(cutline){

        })
    })
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






