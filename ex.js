var GeoStore = require('.')
var memdb = require('memdb')

var store = GeoStore(memdb(), { tileSize: 50 })

var pending = 20
console.time('insert')
function insert () {
  if (!pending) return check()
  var x = Math.random() * 200 - 100
  var y = Math.random() * 200 - 100
  var loc = 'hey'
  store.insert([x,y], loc, function (err) {
    pending--
    insert()
  })
}
insert()

function check () {
  console.timeEnd('insert')
  store.queryStream([[0,0],[90,180]])
  console.log('done')
}
