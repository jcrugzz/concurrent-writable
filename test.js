var assert = require('assert');
var parallel = require('./');
var Writable = require('stream').Writable;

/**
 * Returns a new slow writable stream
 */

function SlowWritable(){
  var stream = new Writable({ objectMode: true });
  stream._write = function(message, encoding, callback){
    setTimeout(function (){
      message.processed = true;
      callback();
    }, 50);
  }
  return stream;
}

describe('concurrent-writable', function(){
  it('should batch writes', function(done){
    var stream = SlowWritable();
    parallel(stream, 20);
    var writes = [];
    for (var i = 0; i < 103; i++) writes.push({});
    stream.on('finish', function(){
      writes.forEach(function(write){ assert(write.processed); });
      done();
    });
    writes.forEach(function(write){ stream.write(write); });
    stream.end();
  });

  it('should set up the event listeners properly', function(done){
    var writes = [];
    var stream = SlowWritable();
    stream.on('finish', verify);
    parallel(stream, 20);
    for (var i = 0; i < 103; i++) writes.push({});
    writes.forEach(function(write){ stream.write(write); });
    stream.end();
    function verify(){
      writes.forEach(function(write){ assert(write.processed); });
      done();
    }
  });
});