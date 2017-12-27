var turf = require('@turf/turf')
var polygon = turf.polygon([
    [
        [
            98.8769531,
            35.3173663
        ],
        [
            83.144531,
            14.349547
        ],
        [
            111.621093,
            14.8598504
        ],
        [
            98.8769531,
            35.3173663
        ]
    ]
])
var line = turf.lineString([
    [
        111.621093,
        14.8598504
    ],
    [
        98.87369155883789,
        35.31687608544746
    ]
])

var result = turf.booleanContains(polygon,line)
console.log(result)