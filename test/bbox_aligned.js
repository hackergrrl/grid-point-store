var GeoStore = require('..')
var test = require('tape')
var memdb = require('memdb')

test('zoom 14 aligned bbox', function (t) {
  var store = GeoStore(memdb(), { zoomLevel: 14 })

  var bbox = [
    [ -1.252341676699629, -77.29980468749999 ],
    [ -1.2303741774326145, -77.27783203125 ]
  ]

  store.insert([-1.24, -77.28], 'inside', function (err) {
    t.error(err)
    store.insert([-1.252341676699630, -77.28], 'outside1', function (err) {
      t.error(err)
      store.insert([-1.252341676699629, -77.27783203124 ], 'outside2', function (err) {
        t.error(err)
        check()
      })
    })
  })

  function check () {
    var q = store.queryStream(bbox)
    var num = 0
    q.on('data', function (pt) {
      t.equal(pt.lat, -1.24)
      t.equal(pt.lon, -77.28)
      t.equal(pt.value, 'inside')
      num++
    })
    q.on('end', function () {
      t.equal(num, 1)
      t.end()
    })
  }
})

