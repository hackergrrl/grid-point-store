var test = require('tape')
var suite = require('abstract-point-store/test')
var Geo = require('..')
var memdb = require('memdb')

function wrapper (opts) {
  opts.zoomLevel = 10
  return new Geo(opts)
}

suite(test, wrapper, function () { return memdb() })
