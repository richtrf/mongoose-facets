
[![Build Status](https://travis-ci.org/danieldkim/mongoose-facets.svg?branch=master)](https://travis-ci.org/danieldkim/mongoose-facets)

# Mongoose Facets

Facet injection for your [Mongoose](http://mongoosejs.com/) models.  Read more
about [facets in MongoDB](https://medium.com/@danieldkim/facets-in-mongodb-be2795144d5a#.lcc88xe0u).

## Installation

```
npm install mongoose-facets
```

## Usage

The convention for naming facet models is `FooFacet`.  They should be defined
in files with the corresponding name and export the model returned by the
`mongoose.model()` method.  For example, in `FooFacet.js`:

```javascript
module.exports = mongoose.model('FooFacet', FooFacetSchema);
```

Place all the facets in the same directory as the parent model and plug in mongoose facets:

```javascript
ParentSchema.plugin(require('mongoose-facets'), { dirname: __dirname });
```

You can place them in a different directory if you choose; just specify the
correct directory in the `dirname` option.

Each facet schema will be added to the parent schema under the key
`facets.{name}` where the name is taken from the name of the model minus the
"Facet" suffix, i.e. `FooFacet` will added be under the key `facets.foo`.

A boolean flag of the form `facetFlags.{name}` will also be added to the
parent schema for each facet. This value will be automagically set properly by
the plugin depending on whether a given facet object exists under the
appropriate key. You can use these flags to query by facet type:

```javascript
Parent p1 = yield Parent.create({name: 'joe smith', facets: {foo:{}}});
Parent p2 = yield Parent.create({name: 'joe jones'});
// find parents with a foo facet and whose name starts with 'joe'
const results = yield Parent.find({'facetFlags.foo': true, name: /^joe/}).exec();
// only p1 is returned
assert.deepEqual(results.map(p=>p.id), [p1.id] "Only p1 should be found");
```

The directory containing the facets can also include a file called
`facet_indexes.js` which exports indexes that should be applied to the parent
collection.  This should be an array of arrays where the sub-arrays are
arguments to the [Schema.index()](http://mongoosejs.com/docs/api.html#schema_Schema-index)
method:

```javascript
module.exports = [
  [{fieldA: 1}, {unique: true}],
  [{fieldB: 1, fieldC: -1}],
];
```

You can export a function instead if you want to make this more dynamic.  The
function will be passed all of the facet keys that have been discovered and
added to the parent schema (these will be relative keys minus the `facets.`
prefix, not the full absolute key):

```javascript
// create an index by name for each facet, 
// i.e. to find "users with an admin facet and name that starts with ..."
module.exports = (facetKeys) => {
  return facetKeys.map(key => [{[`facetFlags.${key}`]: 1, name: 1}, {sparse: true}]);
};
```

The facet keys will also be available through the static `FACET_KEYS` property
of the parent model.

A `parent` property will be automagically added to each facet:

```javascript
Parent p = new Parent();
p.facets.foo = new FooFacet();
assert.equal(p.facets.foo.parent, p, "Parent not set properly");
```

## License

MIT