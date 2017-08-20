var GeoStore = require('.')
var memdb = require('memdb')

var store = GeoStore(memdb(), { tileSize: 50 })

var pending = 10
var spread = 0.03
console.time('insert')
function insert () {
  if (!pending) return check()
  var x = Math.random() * spread - spread/2
  var y = Math.random() * spread - spread/2
  var loc = 'hey'
  store.insert([x,y], loc, function (err) {
    pending--
    insert()
  })
}
insert()

function check () {
  console.timeEnd('insert')
  console.time('query')
  // store.queryStream([[0,0],[90,180]])
  var q = store.queryStream([[-0.01,-0.01],[0.01,0.01]])
  q.on('data', function (pt) {
    console.log('data', pt)
  })
  q.on('end', function () {
    console.timeEnd('query')
  })
  console.log('done')
}
