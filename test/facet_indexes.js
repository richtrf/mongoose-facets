'use strict';
module.exports = [['foo', 'bar'], ['foobar']];
module.exports.setAsFunction = function(f) {
  module.exports = f;
}