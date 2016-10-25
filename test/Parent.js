'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var facetsPlugin = require('../');

const ParentSchema = new Schema({
  name: String,
});

const indexes = [];

ParentSchema.index = function() {
  indexes.push(Array.prototype.slice.call(arguments));
};

ParentSchema.static('indexes', indexes);

ParentSchema.plugin(facetsPlugin, {
  dirname: __dirname,
});

module.exports = mongoose.model('Parent', ParentSchema);
