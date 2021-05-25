import { check, Match } from 'meteor/check'
import { Mongo } from 'meteor/mongo'

const isDDPConnection = Match.Where(c => c &&
  typeof c.call === 'function' &&
  typeof c.subscribe === 'function' &&
  typeof c.apply === 'function' &&
  typeof c.status === 'function' &&
  typeof c.reconnect === 'function' &&
  typeof c.disconnect === 'function')

const isMaybeMongoCollection = Match.Where(c => {
  if (typeof c === 'undefined') return true
  if (c instanceof Mongo.Collection) return true
  return (c.prototype && c.prototype instanceof Mongo.Collection)
})

const allModifications = {
  insert: () => false,
  update: () => false,
  remove: () => false
}

/**
 * Creates a new collection factory function by given options.
 * @param custom {Mongo.Collection?} a custom class extending Mongo.Collection
 * @param schemaFactory {function?} a function that returns a schema that can be attached to the collection
 * @return {function} the factory function to create new collections
 */

export const createCollectionFactory = ({ custom, schemaFactory } = {}) => {
  check(custom, isMaybeMongoCollection)
  check(schemaFactory, Match.Maybe(Function))

  const ProductConstructor = custom || Mongo.Collection
  const isRequiredSchema = schemaFactory ? Object : Match.Maybe(Object)

  /**
   * Creates a new Mongo.Collection by given parameters and options
   * @param options.name {string|null} Name of the collection
   * @param options.schema {object?} schema of the collection. Should be a definition object, not an instance!
   * @param options.attachSchema {boolean?} optional flag to indicate, whether this collection should have it's related schema attached
   * @param options.connection {DDP.connection?} See: https://docs.meteor.com/api/collections.html#Mongo-Collection
   * @param options.idGeneration {string?} See: https://docs.meteor.com/api/collections.html#Mongo-Collection
   * @param options.transform {function?} See: https://docs.meteor.com/api/collections.html#Mongo-Collection
   * @param options.defineMutationMethods {boolean?} See: https://docs.meteor.com/api/collections.html#Mongo-Collection
   * @return {Mongo.Collection} A Mongo.Collection instance
   */

  return options => {
    check(options, Match.ObjectIncluding({
      name: options.collection
        ? Match.Maybe(String)
        : Match.OneOf(String, null),
      schema: isRequiredSchema,
      collection: Match.Maybe(isMaybeMongoCollection),
      connection: Match.Maybe(isDDPConnection),
      attachSchema: Match.Maybe(Boolean),
      idGeneration: Match.Maybe(String),
      transform: Match.Maybe(Function),
      defineMutationMethods: Match.Maybe(Boolean)
    }))

    const {
      name,
      schema,
      collection,
      attachSchema,
      connection,
      idGeneration,
      transform,
      defineMutationMethods
    } = options

    // 1. this is the most basic creation of the collection
    // as shown in the Meteor documentation:
    // https://docs.meteor.com/api/collections.html#Mongo-Collection
    //
    // 2. if we pass an already existing collection, we do not create
    // a new collection but use it to attach schema etc. which
    // can be required for collections, such as Meteor.users
    const product = collection || new ProductConstructor(name, {
      connection,
      idGeneration,
      transform,
      defineMutationMethods
    })

    // by default every client modification is denied
    product.deny(allModifications)

    if (schemaFactory) {
      product.schema = schemaFactory(schema)
    }

    // this is to support aldeed:collection2
    // but we need to make sure, that it's optional
    // see: https://github.com/Meteor-Community-Packages/meteor-collection2
    if (attachSchema !== false && typeof product.attachSchema === 'function') {
      product.attachSchema(product.schema)
    }

    return product
  }
}
