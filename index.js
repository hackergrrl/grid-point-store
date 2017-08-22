var Readable = require('stream').Readable

module.exports = GridPointStore

var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// TODO: store point data as a buffer that is appended to
function GridPointStore (leveldb, opts) {
  if (!(this instanceof GridPointStore)) return new GridPointStore(leveldb, opts)
  opts = opts || {}

  this.db = leveldb
  this.zoomLevel = opts.zoomLevel || 16
  this.mapSize = Math.pow(2, this.zoomLevel)
}

GridPointStore.prototype.insert = function (pt, value, cb) {
  var self = this

  var at = this.pointToTileString(pt).split(',')
  var idx = at[0] + ',' + at[1]

  // console.log(pt, idx)

  this.db.get(idx, function (err, json) {
    if (err && !err.notFound) return cb(err)
    var data = []
    if (json) {
      data = JSON.parse(json)
    }
    var item = {
      lat: pt[0],
      lon: pt[1],
      value: value
    }
    data.push(item)
    self.db.put(idx, JSON.stringify(data), cb)
  })
}

GridPointStore.prototype.queryStream = function (bbox) {
  var stream = new Readable({ objectMode: true })
  stream._read = function () {}

  bbox[0][0] += 0.00000001
  bbox[1][1] -= 0.00000001

  var y = latToMercator(bbox[1][0], this.mapSize)
  var endY = latToMercator(bbox[0][0], this.mapSize)
  // console.log('endY', endY)

  var pending = 0
  // TODO: should bbox queries inclusive on the bottom+right edges?
  while (y <= endY) {
    // console.log('y', y)
    var left = lonToMercator(bbox[0][1], this.mapSize)
    var right = lonToMercator(bbox[1][1], this.mapSize)
    console.log('left', left, 'right', right)
    var leftKey = tileToTileString(y) + ',' + tileToTileString(left)
    var rightKey = tileToTileString(y) + ',' + tileToTileString(right)
    console.log('from', leftKey, 'to', rightKey)
    pending++

    if (leftKey !== rightKey) {
      var rs = this.db.createReadStream({
        gte: leftKey,
        lte: rightKey
      })
      rs.on('data', function (data) {
        var pts = JSON.parse(data.value)
        pts.forEach(function (pt) {
          if (pt.lat >= bbox[0][0] && pt.lat <= bbox[1][0] &&
              pt.lon >= bbox[0][1] && pt.lon <= bbox[1][1]) {
            stream.push(pt)
          }
        })
      })
      rs.on('end', function () {
        if (!--pending) stream.push(null)
      })
    } else {
      this.db.get(leftKey, function (err, value) {
        if (err && err.notFound) return
        if (err) return stream.emit('error', err)
        var pts = JSON.parse(value)
        return pts.forEach(function (pt) {
          if (pt.lat >= bbox[0][0] && pt.lat <= bbox[1][0] &&
              pt.lon >= bbox[0][1] && pt.lon <= bbox[1][1]) {
            stream.push(pt)
            if (!--pending) stream.push(null)
          }
        })
      })
    }

    y++
  }

  return stream
}

GridPointStore.prototype.pointToTileString = function (pt) {
  var lat = latToMercator(pt[0], this.mapSize)
  var lon = lonToMercator(pt[1], this.mapSize)
  // console.log('pt[0], pt[1]', pt[0], pt[1])
  // console.log('lat, lon', lat, lon)
  return tileToTileString(lat) + ',' + tileToTileString(lon)
}

// non-negative numbers only, if you want proper lex sort order
function tileToTileString (n) {
  // console.log('in', n)
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
  // console.log('out', str)
  return str
}

function lonToRawMercator (lon, mapSize) {
  return ((lon + 180) / 360) * mapSize
}

// Lifted from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
function latToRawMercator (lat, mapSize) {
  return (1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 * mapSize
}

function lonToMercator (lon, mapSize) {
  return Math.floor(lonToRawMercator(lon, mapSize))
}

function latToMercator (lat, mapSize) {
  return Math.floor(latToRawMercator(lat, mapSize))
}

