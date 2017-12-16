var fs = require('fs');
var turf = require('@turf/turf');
var equals = require('array-almost-equal')


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
        var multiPloygonsArray = []
        /* 目标polygon和 互相切割成成线段*/
        var targetLines = [];
        var geolines = [];
        if(multippolygon[i].geometry.type === 'MultiPolygon'){
            multiPloygonsArray = turf.flatten(multippolygon[i]).features
        }else{
            multiPloygonsArray = [multippolygon[i]];
        }

        multiPloygonsArray.forEach(function (polygon) {
            var lineString = turf.polygonToLine(polygon)
            if(turf.lineIntersect(lineString,testGeoLine).features.length !== 0){
                targetLines = targetLines.concat(turf.lineSplit(lineString,testGeoLine).features)
                geolines = turf.lineSplit(testGeoLine,lineString).features
                geolines = handleLines(polygon,geolines,true)
                linkPolygon(polygon,testGeo,targetLines,geolines)
            }else{
                // multiPloygon中没有和目标对象相交的线段
                targetLines = targetLines.concat([lineString])
            }
        })

    }
}

/**
 * 返回不在切割区域内的线
 * @param testGeo
 * @param mainLines
 * @returns {Array}
 */
function handleLines(testGeo,mainLines,reverse){
    var reverse = reverse ? reverse : false;
    var filterLines = [],resultLines = [],connect1,connect2;
    // 过滤掉切割范围内的线段
    mainLines.forEach(function(line){
        if(reverse ? turf.booleanContains(testGeo,line):(!turf.booleanContains(testGeo,line))){
            filterLines.push(line)
        }
    })
    // 连接polygon转lineString时切割点的位置
    for(var i = 0; i < filterLines.length; i++){
        for(var j = i+1; j < filterLines.length; j++){
            var line1 = filterLines[i].geometry.coordinates;
            var line2 = filterLines[j].geometry.coordinates;
            if(equals(line1[0],line2[0]) || equals(line1[0],line2[line2.length - 1]) || equals(line1[line1.length],line2[0]) || equals(line1[line1.length],line2[line1.length])){
                connect1 = i;
                connect2 = j;
                break;
            }
        }
    }
    if(typeof connect1 !== 'undefined'){
        var c1Coordinates = filterLines[connect1].geometry.coordinates;
        var c2Coordinates = filterLines[connect2].geometry.coordinates;
        if(equals(c1Coordinates[0],c2Coordinates[0])){
            c1Coordinates.reverse();
            c1Coordinates.pop();
            filterLines[connect1].geometry.coordinates = c1Coordinates.concat(c2Coordinates)
        }else if(equals(c1Coordinates[0],c2Coordinates[c2Coordinates.length - 1])){
            c1Coordinates.reverse();
            c1Coordinates.pop();
            c2Coordinates.reverse();
            filterLines[connect1].geometry.coordinates = c1Coordinates.concat(c2Coordinates)
        }else if(equals(c1Coordinates[c1Coordinates.length - 1],c2Coordinates[0])){
            c1Coordinates.pop();
            filterLines[connect1].geometry.coordinates = c1Coordinates.concat(c2Coordinates)
        }else{
            c1Coordinates.pop();
            c2Coordinates.reverse();
            filterLines[connect1].geometry.coordinates = c1Coordinates.concat(c2Coordinates)
        }
        resultLines.push(filterLines[connect1])
    }
    for(var i = 0; i < filterLines.length; i++){
        if(i !== connect1 && i !== connect2){
            resultLines.push(filterLines[i])
        }
    }

    return resultLines;
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
   var mainLines = handleLines(testF,mainLines)
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
    var line1StartPoint =  line1.geometry.coordinates[0];
    var line1EndPoint =  line1.geometry.coordinates[line1.geometry.coordinates[0].length - 1];
    var line2StartPoint =  line2.geometry.coordinates[0];
    var line2EndPoint =  line2.geometry.coordinates[line2.geometry.coordinates[0].length - 1];
    if((equals(line1StartPoint,line2StartPoint) && equals(line1EndPoint,line2EndPoint)) || (equals(line1StartPoint,line2EndPoint) && equals(line1EndPoint,line2StartPoint))){
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






