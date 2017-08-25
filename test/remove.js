var GeoStore = require('../')
var test = require('tape')
var memdb = require('memdb')

test('remove', function (t) {
  t.plan(8)

  var kdb = GeoStore(memdb(), {
    pointType: 'float32',
    valueType: 'uint32'
  })

  kdb.insert([ 1, 2 ], 333, function (err) {
    t.ifError(err)
    kdb.insert([ 1, 2 ], 444, function (err) {
      t.ifError(err)
      kdb.insert([ -1, 0 ], 555, function (err) {
        t.ifError(err)
        kdb.query([[-5, -5],[5,5]], function (err, pts) {
          t.ifError(err)
          t.deepEqual(pts, [
            { lat:  1, lon: 2, value: 333 },
            { lat:  1, lon: 2, value: 444 },
            { lat: -1, lon: 0, value: 555 }
          ])
          remove()
        })
      })
    })
  })

  function remove () {
    kdb.remove([ 1, 2 ], function (err) {
      t.ifError(err)
      kdb.query([[-5, -5],[5,5]], function (err, pts) {
        t.ifError(err)
        t.deepEqual(pts, [
          { lat: -1, lon: 0, value: 555 }
        ])
      })
    })
  }
})
