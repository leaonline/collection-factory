/* global describe it */
import { Mongo } from 'meteor/mongo'
import { Random } from 'meteor/random'
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { expect } from 'chai'
import SimpleSchema from 'simpl-schema'

const schemaFactory = def => new SimpleSchema(def)

// let's do a simple mock for aldeed:collection2 functionality
// where we assume that if we have attached a schema, then
// basic insert / update operations will validate the input
// however, we should not test aldeed:collection2 functionality here

Mongo.Collection.prototype.attachSchema = function (schema) { this._schema = schema }
const originalInsert = Mongo.Collection.prototype.insert
Mongo.Collection.prototype.insert = function (doc, callback) {
  const self = this
  if (self._schema) self._schema.validate(doc)
  return originalInsert.call(self, doc, callback)
}

// this will be used for testing a custom collection

class CustomCollection extends Mongo.Collection {
  insert (doc, callback) {
    const stampedDoc = Object.assign({}, doc, { createdAt: new Date() })
    return super.insert(stampedDoc, callback)
  }
}

describe('all defaults, no parameters', function () {
  it('returns a factory function without further parameters', function () {
    const createCollection = createCollectionFactory()
    const Collection = createCollection({ name: Random.id() })
    expect(Collection).to.be.an.instanceof(Mongo.Collection)
  })
})

describe('with custom collection class', function () {
  it('throws if custom is not a Mongo.Collection', function () {
    const custom = Date // some non-Mongo.Collection constructor
    expect(() => createCollectionFactory({ custom })).to.throw()
  })
  it('creates a factory for a custom Mongo.Collection', function () {
    const createCollection = createCollectionFactory({ custom: CustomCollection })
    const RandomCollection = createCollection({ name: Random.id() })
    const insertDoc = { title: Random.id() }
    const insertId = RandomCollection.insert(insertDoc)
    const actualDoc = RandomCollection.findOne(insertId)
    expect(actualDoc.title).to.equal(insertDoc.title)
    expect(actualDoc.createdAt).to.be.instanceOf(Date)
  })
})

describe('with schema', function () {
  it('allows to pass a schema factory', function () {
    const createCollection = createCollectionFactory({ schemaFactory })
    const RandomCollection = createCollection({ name: Random.id(), schema: { title: String } })

    // schema validation error
    expect(() => RandomCollection.insert({ age: 10 })).to.throw()

    // schema validation passed
    const insertDoc = { title: Random.id() }
    const inserId = RandomCollection.insert(insertDoc)
    const actualDoc = RandomCollection.findOne(inserId)
    expect(actualDoc.title).to.equal(insertDoc.title)
  })
  it('throws if the schema factory is not a function', function () {
    const throwsOn = schemaFactory => expect(() => createCollectionFactory({ schemaFactory })).to.throw()

    throwsOn('some string')
    throwsOn({ foo: 'BAR' })
    throwsOn(100.1)
    throwsOn([])
    throwsOn(new Date())
    throwsOn(true)
  })
  it('throws if a schema factory but no schema is given', function () {
    const createCollection = createCollectionFactory({ schemaFactory })
    expect(() => createCollection({ name: Random.id() }).to.throw())
  })
  it('allows to skip attaching a schema', function () {
    const createCollection = createCollectionFactory({ schemaFactory })
    const RandomCollection = createCollection({ name: Random.id(), schema: { title: String }, attachSchema: false })

    // no schema validation error
    expect(RandomCollection.insert({ age: 10 })).to.be.a('string')
  })
})

describe('with existing collection', function () {
  it('throws if existing collection is no Mongo.Collection instance', function () {
    const createCollection = createCollectionFactory()
    expect(() => createCollection({ collection: new Date() }))
  })
  it('returns an unaltered collection, if no schema should be attached', function () {
    const createCollectionWithoutSchema = createCollectionFactory()
    const RandomCollection = createCollectionWithoutSchema({ name: Random.id() })
    const createCollection = createCollectionFactory()
    const ActualCollection = createCollection({ collection: RandomCollection })

    expect(ActualCollection).to.deep.equal(RandomCollection)
  })
  it('allows to attach schema to the existing collection', function () {
    const createCollectionWithoutSchema = createCollectionFactory()
    const RandomCollection = createCollectionWithoutSchema({ name: Random.id() })

    RandomCollection.insert({}) // shoud not raise error

    const createCollection = createCollectionFactory({ schemaFactory })
    createCollection({ collection: RandomCollection, schema: { title: String } })

    expect(() => RandomCollection.insert({})).to.throw()

    RandomCollection.insert({ title: Random.id() })
  })
})
