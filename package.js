/* eslint-env meteor */
Package.describe({
  name: 'leaonline:collection-factory',
  version: '1.0.3',
  // Brief, one-line summary of the package.
  summary: 'Create Mongo collections. Isomorphic. Lightweight. Simple.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/leaonline/collection-factory.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom('1.6')
  api.use('ecmascript')
  api.use('mongo')
  api.mainModule('collection-factory.js')
})

Package.onTest(function (api) {
  Npm.depends({
    chai: '4.2.0',
    'simpl-schema': '1.6.2'
  })

  api.use('ecmascript')
  api.use('mongo')
  api.use('random')
  api.use('meteortesting:mocha')
  api.use('leaonline:collection-factory')
  api.mainModule('collection-factory-tests.js')
})
