module.exports = GridPointStore

var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// TODO: store point data as a buffer that is appended to
function GridPointStore (leveldb, opts) {
  if (!(this instanceof GridPointStore)) return new GridPointStore(leveldb, opts)
  opts = opts || {}

  this.db = leveldb
  this.zoomLevel = opts.zoomLevel || 16
  this.mapSize = Math.pow(2, this.zoomLevel) - 1
}

GridPointStore.prototype.insert = function (pt, value, cb) {
  var self = this

  var at = this.pointToTileString(pt).split(',')
  var idx = at[0] + ',' + at[1]

  console.log(pt, idx)

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
  var y = bbox[0][0]
  var endY = bbox[1][0]
  console.log('endY', endY)

  while (y < endY + this.tileSize) {
    var left = this.pointToTileString([y, bbox[0][1]])
    var right = this.pointToTileString([y, bbox[1][1]])
    console.log('from', left, 'to', right)
    var rs = this.db.createReadStream({
      gt: left,
      lt: right
    })
    rs.on('data', console.log)
    y += this.tileSize
  }
}

GridPointStore.prototype.pointToTileString = function (pt) {
  var lat = latToMercator(pt[0], this.mapSize)
  var lon = lonToMercator(pt[1], this.mapSize)
  console.log(lat, lon)
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
    str += ALPHABET[r]
  }
  // console.log('out', str)
  return str
}

function latToMercator (lat, mapSize) {
  var y = Math.floor(((lat + 180) / 360) * mapSize)
  return y
}

function lonToMercator (lon, mapSize) {
  var x = Math.floor(((lon + 85.0511) / 170.1022) * mapSize)
  return x
}
