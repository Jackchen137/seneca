/* Copyright (c) 2010-2012 Richard Rodger */

var seneca   = require('../../lib/seneca')
var common   = require('../../lib/common')

var shared   = require('./shared')

var assert  = common.assert
var eyes    = common.eyes
var async   = common.async



var scratch = {}
var verify = function(cb,tests){
  return function(err,out) {
    if( err ) return cb(err);
    tests(out)
    cb()
  }
}


//These tests assumes a MySQL database/structure is already created.
//create database 'seneca_test'
//CREATE TABLE foo (id VARCHAR(255), p1 VARCHAR(255))

module.exports = {

  happy: function() {
    var si

    try {
      si = seneca(
        { plugins:[
          { name:'mysql-store', 
            opts:{name:'seneca_test',
            host:'127.0.0.1',
            user:'root',
            password:'secret',
            port:3306} }
        ] },

        function(err,si) {
          assert.isNull(err)

          async.series({
            removeAll: function(cb) {
              var foo = si.make({name$:'foo'})
        
              foo.remove$( {all$:true}, verify(cb, function(res){
                assert.isNull(err)
              }))
            },

            listEmpty: function(cb) {
              var foo = si.make('foo')
              foo.list$({}, verify(cb, function(res){
                assert.equal( 0, res.length)
              }))
            },

            save1: function(cb) {
              var foo = si.make({name$:'foo'})
              foo.p1 = 'v1'
              
              foo.save$( verify(cb, function(foo){
                assert.isNotNull(foo.id)
                assert.equal('v1',foo.p1)
                scratch.foo1 = foo
              }))
            },

            list1: function(cb) {
              scratch.foo1.list$({}, verify(cb, function(res){
                assert.equal( 1, res.length)
              }))
            },

            list2: function(cb) {
              scratch.foo1.list$({id:scratch.foo1.id}, verify(cb, function(res){
                assert.equal( 1, res.length)
              }))
            },

            load1: function(cb) {
              scratch.foo1.load$({id:scratch.foo1.id}, verify(cb, function(res){
                assert.isNotNull(res.id)
              }))
            },

            save2: function(cb) {
              scratch.foo1.p1 = 'v2'

              scratch.foo1.save$(verify(cb, function(foo){
                assert.isNotNull(foo.id)
                assert.equal('v2',foo.p1)
              }))
            },

            load2: function(cb) {
              scratch.foo1.load$({id:scratch.foo1.id}, verify(cb, function(res){
                assert.equal('v2',res.p1)
              }))
            },

            save3: function(cb) {
              var foo = si.make({name$:'foo'})
              foo.p1 = 'v3'
              
              foo.save$( verify(cb, function(foo){
                assert.isNotNull(foo.id)
                assert.equal('v3',foo.p1)
                scratch.foo2 = foo
              }))
            },

            list3: function(cb) {
              scratch.foo2.list$({id:scratch.foo2.id}, verify(cb, function(res){
                assert.equal( 1, res.length)
              }))
            },
            
            remove1: function(cb) {
              scratch.foo2.remove$( {id:scratch.foo2.id}, verify(cb, function(res){
                assert.isNull(err)
              }))
            },

            list4: function(cb) {
              var foo = si.make('foo')
              foo.list$({}, verify(cb, function(res){
                assert.equal( 1, res.length)
              }))
            },

          }, function(err,out) {
            if( err ) {
              eyes.inspect(err)
            }
            assert.isNull(err)
            si.close()
          })
        })
    }
    catch( e ) {
      //eyes.inspect(e)
      si && si.close()
      throw e
    }
  }
}
