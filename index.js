var Readable = require('stream').Readable
var Types = require('comparable-storable-types')

module.exports = GridPointStore

var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// TODO: store point data as a buffer that is appended to
function GridPointStore (leveldb, opts) {
  if (!(this instanceof GridPointStore)) return new GridPointStore(leveldb, opts)
  opts = opts || {}

  this.db = leveldb
  this.zoomLevel = opts.zoomLevel || 16
  this.mapSize = Math.pow(2, this.zoomLevel)
  this.pointType = Types(opts.pointType || 'float64')
  this.valueType = Types(opts.valueType || 'uint32')
}

GridPointStore.prototype.insert = function (pt, value, cb) {
  var self = this

  var at = this.pointToTileString(pt).split(',')
  var idx = at[0] + ',' + at[1]

  this.db.get(idx, {valueEncoding: 'binary'}, function (err, buf) {
    if (err && !err.notFound) return cb(err)

    var itemBuf = new Buffer(self.pointType.size * 2 + self.valueType.size)
    var pos = 0
    self.pointType.write(itemBuf, pt[0], pos); pos += self.pointType.size
    self.pointType.write(itemBuf, pt[1], pos); pos += self.pointType.size
    self.valueType.write(itemBuf, value, pos)

    if (buf) buf = Buffer.concat([buf, itemBuf])
    else buf = itemBuf

    self.db.put(idx, buf, {valueEncoding: 'binary'}, cb)
  })
}

GridPointStore.prototype.query = function (q, opts, cb) {
  if (!cb && typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  var res = []
  var rs = this.queryStream(q)
  rs.on('data', function (data) { res.push(data) })
  rs.on('end', function () { cb(null, res) })
}

GridPointStore.prototype.queryStream = function (bbox) {
  var stream = new Readable({ objectMode: true })
  stream._read = function () {}

  bbox[0][0] += 0.00000001
  bbox[1][1] -= 0.00000001

  var self = this

  var y = latToMercator(bbox[1][0], this.mapSize)
  var endY = latToMercator(bbox[0][0], this.mapSize)

  var pending = 0
  // TODO: should bbox queries inclusive on the bottom+right edges?
  while (y <= endY) {
    var left = lonToMercator(bbox[0][1], this.mapSize)
    var right = lonToMercator(bbox[1][1], this.mapSize)
    var leftKey = tileToTileString(y) + ',' + tileToTileString(left)
    var rightKey = tileToTileString(y) + ',' + tileToTileString(right)
    pending++

    if (leftKey !== rightKey) {
      var rs = this.db.createValueStream({
        gte: leftKey,
        lte: rightKey,
        valueEncoding: 'binary'
      })
      rs.on('data', onData)
      rs.on('end', function () {
        if (!--pending) stream.push(null)
      })
    } else {
      this.db.get(leftKey, {valueEncoding: 'binary'}, function (err, value) {
        if (err && err.notFound) return
        if (err) return stream.emit('error', err)
        onData(Buffer(value))
        if (!--pending) stream.push(null)
      })
    }

    y++
  }

  function onData (buf) {
    var pts = self.deserializePoints(buf)
    for (var i = 0; i < pts.length; i++) {
      var pt = pts[i]
      if (pt.lat >= bbox[0][0] && pt.lat <= bbox[1][0] &&
          pt.lon >= bbox[0][1] && pt.lon <= bbox[1][1]) {
        stream.push(pt)
      }
    }
  }

  return stream
}

// Buffer -> [Point]
GridPointStore.prototype.deserializePoints = function (buf) {
  var pos = 0
  var res = []
  while (pos < buf.length) {
    var lat = this.pointType.read(buf, pos); pos += this.pointType.size
    var lon = this.pointType.read(buf, pos); pos += this.pointType.size
    var val = this.valueType.read(buf, pos); pos += this.valueType.size
    res.push({
      lat: lat,
      lon: lon,
      value: val
    })
  }
  return res
}

GridPointStore.prototype.pointToTileString = function (pt) {
  var lat = latToMercator(pt[0], this.mapSize)
  var lon = lonToMercator(pt[1], this.mapSize)
  return tileToTileString(lat) + ',' + tileToTileString(lon)
}

// non-negative numbers only, if you want proper lex sort order
function tileToTileString (n) {
  var str = ''
  if (n < 0) {
    str += '-'
    n *= -1
  }
  if (n === 0) {
    return ALPHABET[0]
  }
  while (n > 0) {
    var r = n % ALPHABET.length
    n = Math.floor(n / ALPHABET.length)
    str = ALPHABET[r] + str
  }
  return str
}

function lonToRawMercator (lon, mapSize) {
  return ((lon + 180) / 360) * mapSize
}

// Lifted from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
function latToRawMercator (lat, mapSize) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * mapSize
}

function lonToMercator (lon, mapSize) {
  return Math.floor(lonToRawMercator(lon, mapSize))
}

function latToMercator (lat, mapSize) {
  return Math.floor(latToRawMercator(lat, mapSize))
}
