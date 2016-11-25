'use strict';

const path = require('path');
const assert = require('assert');
const _ = require('lodash');
const co = require('co');
const Q = require('q');
const mongoose = require('mongoose');
const mongooseutils = require('mongoose/lib/utils');
let db;
let Parent;
let AFacet;
let BFacet;
const indexes = require('./facet_indexes');

before(co.wrap(function*() {
  const port = process.env.MONGO_PORT || 27017;
  yield Q.ninvoke(mongoose, 'connect', `mongodb://localhost:${port}/mongoose_facets`);
  db = mongoose.connection.db;

  Parent = require('./Parent');
  AFacet = require('./AFacet');
  BFacet = require('./BFacet');
}));

afterEach(co.wrap(function*() {
  const collections = yield _.keys(mongoose.models).map(function(name) {
    const collName = mongooseutils.toCollectionName(name);
    return Q.ninvoke(db, 'collection', collName);
  });
  yield [
    collections.map(function(collection) {
      return Q.ninvoke(collection, 'remove');
    }),
  ];
}));

function* saveAndReload(p) {
  yield p.save();
  return Parent.findById(p.id).exec();
}

describe('FacetPlugin', function() {
  it('should apply indexes', co.wrap(function*() {
    assert.ok(_.isEqual(indexes, Parent.indexes));

    // now try with function
    delete require.cache[require.resolve('./Parent')];
    delete mongoose.models.Parent;
    indexes.setAsFunction(facetKeys => facetKeys.map(k=>[`foo.${k}`, `bar.${k}`]));
    Parent = require('./Parent');
    assert.ok(_.isEqual([['foo.a', 'bar.a'], ['foo.b', 'bar.b']], Parent.indexes));
  }));


  it('should save facets', co.wrap(function*() {  
    let p = new Parent();
    p = yield saveAndReload(p);

    // facet property
    const aFacetName = 'a facet name';
    p.facets.a = new AFacet({name: aFacetName});
    p = yield saveAndReload(p);
    assert.equal(p.facets.a.name, aFacetName);

    // facet property, set subfacet array
    p.facets.a.setSubs(['foo', 'bar']);
    p = yield saveAndReload(p);
    assert.ok(_.isEqual(
      [{name: 'foo'}, {name:'bar'}],
      p.facets.a.subFacets.toObject()
    ));

    // facet property, push subfacet array
    p.facets.a.pushSub('foobar');
    p = yield saveAndReload(p);
    assert.ok(_.isEqual(
      [{name: 'foo'}, {name:'bar'}, {name: 'foobar'}],
      p.facets.a.subFacets.toObject()
    ));

    // subfacet array element property
    p.facets.a.subFacets[0].name = 'barfoo';
    p = yield saveAndReload(p);
    assert.equal(p.facets.a.subFacets[0].name, 'barfoo');
  }));

  it('should set parent on facets', co.wrap(function*() {
    let p = new Parent();
    let a = p.facets.a = new AFacet();
    let b = p.facets.b = new BFacet();
    assert.equal(a.parent, p);
    assert.equal(p.facets.a.parent, p);
    assert.equal(b.parent, p);
    assert.equal(p.facets.b.parent, p);

    p = yield saveAndReload(p);
    assert.equal(p.facets.a.parent, p);
    assert.equal(p.facets.b.parent, p);
  }));

  it('should set facet flags on parent', co.wrap(function*() {
    let p = new Parent({facets: {a:{}}});
    p = yield saveAndReload(p);
    assert(p.facetFlags.a);
    assert.ok(!p.facetFlags.b);

    p.facets.b = new BFacet();
    p = yield saveAndReload(p);
    assert(p.facetFlags.a);
    assert(p.facetFlags.b);

    // should remove flag
    p.facets.a = undefined;
    p = yield saveAndReload(p);
    assert.ok(!p.facetFlags.a);
    assert(p.facetFlags.b);
  }));

});