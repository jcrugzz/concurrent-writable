var Emitter = require('events').EventEmitter;

/**
 * Process `concurrency` items from `stream` at a time.
 *
 * @param {Writable} stream
 * @param {Number} concurrency
 */

module.exports = function(stream, concurrency){
  var _write = stream._write.bind(stream);
  var on = stream.on.bind(stream);
  var inFlight = 0;
  var self = this;
  var done = false;
  var emitter = new Emitter();
  var listeners = stream.listeners('finish');
  stream.removeAllListeners('finish');

  stream._write = function(message, encoding, callback){
    inFlight++;
    var deferred = inFlight >= concurrency;
    _write(message, encoding, function (err){
      inFlight--;
      if (err) self.emit('error', err);
      if (deferred) callback();
      if (done && !inFlight) emitter.emit('finish');
    });
    if (!deferred) setImmediate(callback);
  };

  stream.on = function(event, fn){
    if (event !== 'finish') return on(event, fn.bind(stream));
    return on('finish', function(){
      if (!done) done = true;
      if (!inFlight) fn.call(stream);
      else emitter.once('finish', fn.bind(stream));
    });
  };

  listeners.forEach(function(fn){ stream.on('finish', fn); });
  return stream;
};
