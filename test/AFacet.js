'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AFacetSubFacetSchema = new Schema({
  name: String,
}, {_id: false});
const AFacetSubFacet = mongoose.model('AFacetSubFacet', AFacetSubFacetSchema);

const AFacetSchema = new Schema({
  name: String,
  subFacets: [AFacetSubFacetSchema],
}, {_id: false});

AFacetSchema.pre('save', function(next) {
  next();
});

AFacetSchema.methods.setSubs = function(names) {
  this.subFacets = names.map(name=>new AFacetSubFacet({name}));
};

AFacetSchema.methods.pushSub = function(name) {
  this.subFacets.push(new AFacetSubFacet({name}));
};

module.exports = mongoose.model('AFacet', AFacetSchema);
