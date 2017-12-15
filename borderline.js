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
var guizhougeojson = JSON.parse(fs.readFileSync('./json/guizhou.json',{encoding:"utf8"}));
var result = ""
if(guizhougeojson.features){
    var cloned = turf.clone(guizhougeojson).features;
    for(var i = 0,geojson = guizhougeojson.features; i < geojson.length;i++){
        if( true){
            if(geojson[i].geometry.type === 'MultiPolygon'){
                var multiPolygon = turf.multiPolygon([]);
                var polygonCollection = turf.unkinkPolygon(geojson[i])
                for(var j = 0, polygons = polygonCollection.features ; j < polygons.length; j++){
                    if(turf.booleanOverlap(polygons[j],testGeo)){
                        var mask = turf.intersect(polygons[j],testGeo);
                        multiPolygon.geometry.coordinates.push(turf.mask(polygons[j],mask).geometry.coordinates)
                    }else{
                        multiPolygon.geometry.coordinates.push(polygons[j].geometry.coordinates)
                    }
                }
                cloned[i] = multiPolygon
            }else if(geojson[i].geometry.type === 'Polygon'){
                var mask = turf.intersect(geojson[i],testGeo);
                if(mask){
                    cloned[i] = turf.mask(geojson[i],mask)
                }
            }
            // var polygons = turf.unkinkPolygon(geojson[i]).features
            // for(var j = 0; j < polygons.length; j++){
            //     if(turf.booleanOverlap(polygons[j],testGeo)){
            //         var mask = turf.intersect(polygons[j],testGeo);
            //         polygons[j] = turf.mask(polygons[j],mask)
            //         //fs.writeFileSync('./out.json',JSON.stringify(polygons),{encoding:"utf8"});
            //     }
            // }

            //var mask = turf.intersect(geojson[i].geometry,testGeo);
           // result = turf.mask(geojson[i].geometry,mask)
           // cloned[i] = result;

        }
    }
    //cloned.push(testGeo)
    fs.writeFileSync('./out.json',JSON.stringify(turf.featureCollection(cloned)),{encoding:"utf8"});


}