# Meteor Mongo Collection Factory

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/leaonline/collection-factory)
![GitHub](https://img.shields.io/github/license/leaonline/collection-factory)

Create Mongo collections. Isomorphic. Lightweight. Simple.

With this package you can define factory functions to create a variety of Mongo.Collection instances.
Decouples definition from instantiation (also for the schema) and allows different configurations for different
types of collections.

## Installation

Simply add this package to your meteor packages

```bash
$ meteor add leaonline:collection-factory
```

## Usage

Import the `createCollectionFactory` method and create the factory function from it:

```javascript
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'

const createCollection = createCollectionFactory() // no params = use defaults
const FancyCollection = createCollection({ name: 'fancy' }) // minimal required
```

### With schema

We support `aldeed:collection2` which itself requires a `schema` to be attached.
To **decouple** schema definition from instantiation, we introduced a `shemaFactory`, which
is basically a function that creates your schema for this collection. This also ensures, that
collections don't share the same schema instances:

```javascript
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import SimpleSchema from 'simpl-schema'

const schemaFactory = definitions => new SimpleSchema(definitions)

const createCollection = createCollectionFactory({ schemaFactory })
const FancyCollection = createCollection({
  name: 'fancy',
  schema: {
    title: String,
    points: {
      type: Number,
      min: 0,
      max: 100
    }
  }
})
```

### With custom `Mongo.Collection`

You can extend the `Mongo.Collection` and pass it to the factory as well.
Note, that you need to inherit from `Mongo.Collection`, solely custom classes are not
supported.

```javascript
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Mongo } from 'meteor/mongo'

class CustomCollection extends Mongo.Collection {
  insert(doc, callback) {
    // there are better ways to do this 
    // but this is a good way to show it 
    doc.createdAt = new Date()
    
    return super.insert(doc, callback)
  }
}

const createCollection = createCollectionFactory({ custom: CustomCollection })
const FancyCollection = createCollection({ name: 'fancy' })
const insertId = FancyCollection.insert({ title: 'some fancy'})
FancyCollection.findOne(insertId) // { title: 'some fancy', createdAt: ISODate("2020-04-20T10:19:54.552Z") }
```

You can combine both examples but note, that if you require a schema, then the above example would require an additional
`createdAt` definition in the schema.

### With existing collection

There are use cases where an existing collection is already defined and you want to attach
the schema but also keep your creational pipeline going.

In this case you just pass in the existing collection with a schema:

```javascript
import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import SimpleSchema from 'simpl-schema'

const schemaFactory = definitions => new SimpleSchema(definitions)

const extendCollection = createCollectionFactory({ schemaFactory })
extendCollection({
  collection: Meteor.users,
  schema: {
    username: String,
    // ... etc.
  }
})
```

## Codestyle

We use `standard` as code style and for linting.

##### via npm

```bash
$ npm install --global standard snazzy
$ standard | snazzy
```

##### via Meteor npm

```bash
$ meteor npm install --global standard snazzy
$ standard | snazzy
```


## Test

We use `meteortesting:mocha` to run our tests on the package.

##### Watch mode

```bash
$ TEST_WATCH=1 TEST_CLIENT=0 meteor test-packages ./ --driver-package meteortesting:mocha
```

##### Cli mode

