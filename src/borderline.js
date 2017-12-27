var fs = require('fs');
var turf = require('@turf/turf');
var equals = require('array-almost-equal')

//var fc = JSON.parse(fs.readFileSync('./json/guizhou.json',{encoding:"utf8"}));

var getNewGeo = function(mainFeatures,testFeature){
    var testGeoLine = turf.polygonToLine(testFeature);
    if(!mainFeatures.features || mainFeatures.features.length === 0) throw new Error("unvalid features!");
    // 最后输出的全新的 feartures数组
    var newFeatures = []
    for(var multippolygon = mainFeatures.features,i =  0; i < multippolygon.length; i++ ){
        var multiPloygonsArray = []
        /* 目标polygon和 互相切割成成线段*/
        var targetLines = [];
        var geolines = [];
        if(multippolygon[i].geometry.type === 'MultiPolygon'){
            multiPloygonsArray = turf.flatten(multippolygon[i]).features
        }else{
            multiPloygonsArray = [multippolygon[i]];
        }
        var tempLinesArray = []
        var newFeature = []
        multiPloygonsArray.forEach(function (polygon) {
            var lineString = turf.polygonToLine(polygon)
            if(turf.lineIntersect(lineString,testGeoLine).features.length !== 0){
                var tempLines = turf.truncate(turf.lineSplit(lineString,testGeoLine),{precision: 6, coordinates: 2})
                targetLines = handleLines(testFeature,targetLines.concat(tempLines.features))
                geolines = turf.truncate(turf.lineSplit(testGeoLine,lineString),{precision: 6, coordinates: 2}).features
                geolines = handleLines(polygon,geolines,true)
                tempLinesArray = linkPolygonCoords(polygon,testFeature,targetLines,geolines)
            }else{
                tempLinesArray.push(polygon.geometry.coordinates[0])
            }
        })
        if(tempLinesArray.length > 1 ){
            var multiLines = turf.lineToPolygon( turf.multiLineString(tempLinesArray))
            multiLines.geometry.type = 'MultiPolygon'
            var coordinates = []
            multiLines.geometry.coordinates.forEach(group =>{
                coordinates.push([group])
            })
            multiLines.geometry.coordinates = coordinates
            newFeature.push(multiLines);
        }else if(tempLinesArray.length === 1 ){
            newFeature.push(turf.lineToPolygon( turf.lineString(tempLinesArray[0])));
        }else{
            throw new Error("has no polygons")
        }
        // properties 还原
        newFeature[0].properties = multippolygon[i].properties;
        newFeatures.push(newFeature[0])
    }
    // 加入新的 切割区域
    newFeatures.push(testFeature)
    fs.writeFileSync('out2.json',JSON.stringify(turf.featureCollection(newFeatures)),{encoding:"utf8"});
    return turf.featureCollection(newFeatures)

}

module.exports = {
    getNewGeo:getNewGeo
}



/**
 * 返回不在切割区域内的线
 * @param testGeo 切割体
 * @param mainLines 被切割体拆分的线段
 * @param reverse
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
 * @param mainPolygon
 * @param testPolygon
 * @param mainLines
 * @param cutLines
 * @returns {Array}
 */
function linkPolygonCoords(mainPolygon,testPolygon,mainLines,cutLines){
    var allLines = mainLines.concat(cutLines),
        resultLines = [],
        linked = false,
        currentLineArray = [];

    for(var i = 0; i <  allLines.length; i++ ){
        currentLineArray.push(allLines[i].geometry.coordinates)
    }
    return nestedLink(currentLineArray);

    /**
     *
     * @param prevLines
     * @param currentLine
     */
    function nestedLink(currentLineArray){
        var nextLineArray = [];
        for(var i = 0; i < currentLineArray.length; i++){
            for(var j = i+1; j < currentLineArray.length; j++){
                var lineArray = currentLineArray[i];
                var lineArrayAfter = currentLineArray[j];
                if(equals(lineArray[0],lineArrayAfter[0])){
                    lineArray.reverse();
                    nextLineArray.push(lineArray.concat(lineArrayAfter))
                    linked = true
                }else if(equals(lineArray[0],lineArrayAfter[lineArrayAfter.length - 1])){
                    nextLineArray.push(lineArrayAfter.concat(lineArray))
                    linked = true
                }else if(equals(lineArray[lineArray.length - 1],lineArrayAfter[0])){
                    nextLineArray.push(lineArray.concat(lineArrayAfter))
                    linked = true
                }else if(equals(lineArray[lineArray.length - 1],lineArrayAfter[lineArrayAfter.length - 1])){
                    lineArrayAfter.reverse();
                    nextLineArray.push(lineArray.concat(lineArrayAfter))
                    linked = true
                }
                if(linked){
                    for(var k = 0; k < currentLineArray.length; k++){
                        if(k !== i && k !== j){
                            nextLineArray.push(currentLineArray[k])
                        }
                    }
                    // if(prevLineArray){
                    //     var prevLineFirst = turf.lineString(prevLineArray[0])
                    //     var nextLineFirst = turf.lineString(nextLineArray[0])
                    //     if(turf.booleanEqual(prevLineFirst,nextLineFirst)){
                    //         linesCoord.push(nextLineArray.shift())
                    //     }
                    // }
                    linked = false;
                    return nestedLink(nextLineArray)
                }
                // if(j === currentLineArray.length - 1 && i === j - 1){
                //     return linesCoord
                // }
            }
        }
        return currentLineArray;
    }
   var mainLines = handleLines(testPolygon,mainLines)
    mainLines.forEach(function (line) {
        cutLines.forEach(function(cutline){
            var nextPoint = turf.point(cutline.geometry.coordinates[1]);
            if( turf.booleanContains(mainPolygon,nextPoint) && booleanLineLinked(line,cutline)){
                var lineArray = line.geometry.coordinates;
                var cutlineArray = cutline.geometry.coordinates;
                // 这条切割线被切割图形内部
                if(equals(lineArray[0],cutlineArray[0])){
                    cutlineArray.reverse();
                }
                line.geometry.coordinates = lineArray.concat(cutlineArray)
            }
        })
    })
    return mainLines;
}

/**
 *  判断2条线是否有相同的起点和终点
 * @param line1
 * @param line2
 * @returns {boolean}
 */
function booleanLineLinked(line1,line2){
    var line1StartPoint =  line1.geometry.coordinates[0];
    var line1EndPoint =  line1.geometry.coordinates[line1.geometry.coordinates.length - 1];
    var line2StartPoint =  line2.geometry.coordinates[0];
    var line2EndPoint =  line2.geometry.coordinates[line2.geometry.coordinates.length - 1];
    if((equals(line1StartPoint,line2StartPoint) || equals(line1EndPoint,line2EndPoint)) || (equals(line1StartPoint,line2EndPoint) || equals(line1EndPoint,line2StartPoint))){
        return true;
    }
    return false;
}








