var turf = require('@turf/turf');
var multiPoly1 = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
var multiPoly2 = turf.multiPolygon([[[[10,10],[10,110],[110,110],[110,0],[10,10]]]]);
var line1 = turf.lineString([[150,1],[170,1]]);
var line2 = turf.lineString([[160,-20],[160,20]]);
var point = turf.lineSplit(line1,line2)
console.log(point)