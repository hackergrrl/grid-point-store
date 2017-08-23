var GeoStore = require('..')
var test = require('tape')
var memdb = require('memdb')

test('random points', function (t) {
  var store = GeoStore(memdb({valueEncoding: 'binary'}), { zoomLevel: 8 })

  var bbox = [ [ -5, -5 ], [ 5, 5 ] ]
  var expected = {}

  var pending = 2000
  var spread = 20
  function insert () {
    if (!pending) return check()
    var x = Math.random() * spread - spread / 2
    var y = Math.random() * spread - spread / 2
    var loc = Math.floor(Math.random() * 1000000)
    store.insert([x, y], loc, function (err) {
      t.error(err)

      pending--

      if (y >= bbox[0][0] && y <= bbox[1][0] &&
          x >= bbox[0][1] && x <= bbox[1][1]) {
        expected[loc] = true
      }

      insert()
    })
  }
  insert()

  function check () {
    var q = store.queryStream(bbox)
    var numExpected = Object.keys(expected).length
    var actual = {}
    q.on('data', function (pt) {
      t.ok(expected[pt.value])
      actual[pt.value] = true
    })
    q.on('end', function () {
      t.equals(Object.keys(actual).length, numExpected)
      t.end()
    })
  }
})
