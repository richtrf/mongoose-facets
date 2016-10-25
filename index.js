const path = require('path');
const mongoose = require('mongoose');
const s = require('underscore.string');

module.exports = function facetsPlugin(schema, options) {
  options = options || {};
  const dirname = options.dirname;

  schema.post('init', function() {
    const { facets } = this;
    for (let k of FACET_KEYS) {
      const f = facets[k];
      if (f) {
        f.parent = this;
      }
    }
  });

  schema.methods.set = function(p, v) {
    const result = mongoose.Document.prototype.set.apply(this, arguments);
    if (/^facets\.(\w+)$/.test(p) && v) {
      this.get(p).parent = v.parent = this;
    }
    return result;
  }

  schema.pre('save', function(next) {
    const { facets } = this;
    for (let key of FACET_KEYS) {
      let flagKey = `facetFlags.${key}`;
      if (facets[key]) {
        this.set(flagKey, true);
      } else {
        this.set(flagKey, undefined);
      }
    }
    next();
  });

  const files = require('fs').readdirSync(dirname);
  const FACET_KEYS = [];
  files.filter((file) => {
      return /Facet\.js$/.test(file);
    }).forEach(function(file) {
      const key = s.decapitalize(file.match(/([^w]+)Facet\.js$/)[1]);
      FACET_KEYS.push(key);
      schema.add({[key]: require(path.join(dirname, file)).schema}, 'facets.');
      schema.add({[key]: Boolean}, 'facetFlags.');
    });

  schema.static('FACET_KEYS', FACET_KEYS);

  if (options.onFacetKeys) {
    options.onFacetKeys.call(undefined, FACET_KEYS);
  }

  if (files.includes('facet_indexes.js')) {
    let facetIndexes = require(`${dirname}/facet_indexes`)
    if (!Array.isArray(facetIndexes)) { // assume it's a function
      facetIndexes = facetIndexes(FACET_KEYS);
    }
    facetIndexes.forEach((index) => {
      schema.index.apply(schema, index);
    });

  }

};