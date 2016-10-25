'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BFacetSubFacet = new Schema({
  title: String,
}, {_id: false});

const BFacetSchema = new Schema({
  title: String,
  subFacets: [BFacetSubFacet],
}, {_id: false});

module.exports = mongoose.model('BFacet', BFacetSchema);
