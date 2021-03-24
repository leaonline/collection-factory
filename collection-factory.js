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
 * @param custom a custom class extending Mongo.Collection
 * @param schemaFactory a function that returns a schema that can be attached to the collection
 * @return {function} the factory function to create new collections
 */

export const createCollectionFactory = ({ custom, schemaFactory } = {}) => {
  check(custom, isMaybeMongoCollection)
  check(schemaFactory, Match.Maybe(Function))

  const ProductConstructor = custom || Mongo.Collection
  const isRequiredSchema = schemaFactory ? Object : Match.Maybe(Object)

  /**
   * Creates a new Mongo.Collection by given parameters and options
   * @param name Name of the collection
   * @param schema schema of the collection. Should be a definition object, not an instance!
   * @param attachSchema optional flag to indicate, whether this collection should have it's related schema attached
   * @param connection See: https://docs.meteor.com/api/collections.html#Mongo-Collection
   * @param idGeneration See: https://docs.meteor.com/api/collections.html#Mongo-Collection
   * @param transform See: https://docs.meteor.com/api/collections.html#Mongo-Collection
   * @param defineMutationMethods See: https://docs.meteor.com/api/collections.html#Mongo-Collection
   * @return {Mongo.Collection} A Mongo.Collection instance
   */

  return ({ name, schema, collection, attachSchema, connection, idGeneration, transform, defineMutationMethods }) => {
    check(name, collection
      ? Match.Maybe(String)
      : Match.OneOf(String, null))
    check(schema, isRequiredSchema)
    check(collection, isMaybeMongoCollection)
    check(connection, Match.Maybe(isDDPConnection))
    check(attachSchema, Match.Maybe(Boolean))
    check(idGeneration, Match.Maybe(String))
    check(transform, Match.Maybe(Function))
    check(defineMutationMethods, Match.Maybe(Boolean))

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
