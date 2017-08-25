var GeoStore = require('..')
var test = require('tape')
var memdb = require('memdb')

test('bad bbox', function (t) {
  t.plan(4)

  var store = GeoStore(memdb(), { zoomLevel: 8, valueType: 'buffer[32]' })

  var bbox = [ [ 63, 100 ], [ 0, -146 ] ]

  store.query(bbox, function (err) {
    t.ok(err)
    t.equal(err.constructor.name, 'Error')

    var q = store.queryStream(bbox)
    q.on('error', function (err) {
      t.ok(err)
      t.equal(err.constructor.name, 'Error')
    })
  })
})

test('points', function (t) {
  var store = GeoStore(memdb({valueEncoding: 'binary'}), { zoomLevel: 8, valueType: 'buffer[32]' })

  var bbox = [ [ 63, -148 ], [ 65, -146 ] ]

  var keys = [
    '04cbe14f95fbc8eb89f7f0fe25886f9c70806ae20b03c24d2fe19a19a45df1e3',
    'a9d8b6f42523f1da18973357cc80aaa0232ac08b531e09fbb707ea3bde31671d',
    '45329be8d167fb8900c09d2d6acd2f72c81c189f9e55052d361df49112c00aeb'
  ]

  store.insert([ 64.5, -147.3 ], new Buffer(keys[0], 'hex'), function (err) {
    t.error(err)
    store.insert([ 63.9, -147.6 ], new Buffer(keys[1], 'hex'), function (err) {
      t.error(err)
      store.insert([ 64.2, -146.5 ], new Buffer(keys[2], 'hex'), function (err) {
        t.error(err)
        checkStream()
      })
    })
  })

  function checkStream () {
    var q = store.queryStream(bbox)
    var actual = []
    q.on('data', function (pt) {
      actual.push(pt.value.toString('hex'))
    })
    q.on('end', function () {
      t.deepEqual(actual.sort(), keys.sort())
      checkCb()
    })
  }

  function checkCb () {
    store.query(bbox, function (err, pts) {
      t.error(err)
      pts = pts.map(function (pt) { return pt.value.toString('hex') })
      t.deepEqual(pts.sort(), keys.sort())
      t.end()
    })
  }
})
