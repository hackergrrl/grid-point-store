var GeoStore = require('.')
var memdb = require('memdb')

var store = GeoStore(memdb(), { zoomLevel: 14 })

var pending = 50000
var spread = 1  // ~100km
console.time('insert')
function insert () {
  if (!pending) return check()
  var x = -77.28 + Math.random() * spread - spread/2
  var y = -1.24 + Math.random() * spread - spread/2
  var loc = 'hey'
  store.insert([y,x], loc, function (err) {
    pending--
    insert()
  })
}
insert()

function check () {
  console.timeEnd('insert')
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
