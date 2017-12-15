var turf = require('@turf/turf');
var multiPoly1 = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
var multiPoly2 = turf.multiPolygon([[[[10,10],[10,110],[110,110],[110,0],[10,10]]]]);
var line1 = turf.polygonToLine(multiPoly1);
var line2 = turf.polygonToLine(multiPoly2);
turf.lineSplit(line1,)