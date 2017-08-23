var GeoStore = require('.')
var memdb = require('memdb')
var level = require('level')

var store = GeoStore(memdb({valueEncoding:'binary'}), { zoomLevel: 14 })
// var store = GeoStore(level('kdb', {valueEncoding:'binary'}), { zoomLevel: 14 })

var pending = 50000
var spread = 1  // ~100km
console.time('insert')
function insert () {
  if (!pending) return check()
  var x = -77.28 + Math.random() * spread - spread/2
  var y = -1.24 + Math.random() * spread - spread/2
  var loc = parseInt(Math.random().toString().substring(15))
  store.insert([y,x], loc, function (err) {
    pending--
    insert()
  })
}
insert()

function check () {
  console.timeEnd('insert')

  console.log('JSON time', store.jtime)

  console.time('query')
  var bbox = [
    [ -1.252341676699629, -77.29980468749999 ],
    [ -1.2303741774326145, -77.27783203125 ]
  ]
  var q = store.queryStream(bbox)
  q.on('data', function (pt) {
    // console.log('data', pt)
  })
  q.on('end', function () {
    console.timeEnd('query')
  })
  console.log('done')
}
