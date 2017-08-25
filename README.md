# grid-point-store

> Fast 2D point insertions and spatial querying over a fixed grid.

## Usage

```js
var GeoStore = require('grid-point-store')
var memdb = require('memdb')

var store = GeoStore(memdb(), { zoomLevel: 14 })

var pending = 10
var spread = 0.1  // ~10km
function insert () {
  if (!pending) return check()
  var x = Math.random() * spread - spread / 2
  var y = Math.random() * spread - spread / 2
  var loc = parseInt(Math.random().toString().substring(15))
  store.insert([y, x], loc, function (err) {
    pending--
    insert()
  })
}
insert()

function check () {
  var bbox = [ [ -1, -1 ], [ 1,  1 ] ]
  var q = store.queryStream(bbox)
  q.on('data', function (pt) {
    console.log('data', pt)
  })
}
```

outputs

```
data { lat: 0.021974959554208737, lon: -0.036042143780795316, value: 486 }
data { lat: 0.01731653112725491, lon: 0.04090562190958498, value: 398 }
data { lat: -0.0059460250360946695, lon: -0.027539338463307098, value: 3 }
data { lat: -0.037361984139033334, lon: -0.002493949477883839, value: 3795 }
data { lat: -0.043988977366412524, lon: -0.03764949331648002, value: 4426 }
data { lat: -0.045367303981649724, lon: -0.03634679567215611, value: 356 }
data { lat: 0.023642309425643854, lon: 0.017864021495420324, value: 81 }
data { lat: -0.031037061354238983, lon: 0.006035785956166738, value: 407 }
data { lat: 0.03480660267412845, lon: 0.032896501435967895, value: 46 }
data { lat: 0.02960226742605787, lon: 0.027872606373290573, value: 788 }
```

## API

```js
var GeoStore = require('grid-point-store')
```

### var store = GeoStore(leveldb[, opts])

Create a new point store `store` backed by the LevelUP instance `leveldb`.

Valid `opts` include:

- `zoomLevel` (integer): an OSM-style zoom level to divide the world up by.
  `zoomLevel == 1` captures the entire world in 1 tile, `2` in 4 tiles, `3` in
  16 tiles, and so forth. Read more on [OSM zoom
  levels](wiki.openstreetmap.org/wiki/Zoom_levels).
- `pointType` (string): a [comparable storable
  type](https://github.com/substack/comparable-storable-types) string for the
  latitude and longitude components. Defaults to `float64`.
- `valueType` (string): a [comparable storable
  type](https://github.com/substack/comparable-storable-types) string for
  point values. Defaults to `uint32`.

### store.insert([lat, lon], value, cb)

Insert a point `[latitude, longitude]` with value `value` into the store.

`cb` is a callback that will be called as `cb(err)` if an error occurs, or
`cb(null)` if the insertion succeeded.

### store.query(bbox[, opts], cb)

Query a rectangular region for points. `cb` is called with the array of points
in the region.

`bbox` is an array of arrays of the form

```
[
  [ topLeftLatitude,     topLeftLongitude ],
  [ bottomRightLatitude, bottomRightLongitude ]
]
```

### var stream = store.queryStream(bbox)

Query a rectangular region for points. Returns the Readable stream `stream`.

### store.remove([lat, lon], cb)

Deletes points at `[latitude, longitude]`.

`cb` is a callback that will be called as `cb(err)` if an error occurs, or
`cb(null)` if the deletion succeeded.

## Caveats

- Missing: stream backpressure on `queryStream`

PRs very welcome! :heart:

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install grid-point-store
```

## See Also

- [kdb-tree-store](https://github.com/peermaps/kdb-tree-store)
- [geohash-point-store](https://github.com/noffle/geohash-point-store)

## License

ISC
