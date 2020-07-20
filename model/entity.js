'use strict'

const { Model } = require('objection')

class Entity extends Model {
  static get tableName () {
    return 'app_table'
  }

  static get _as () {
    return '_app'
  }

  static get _prefix () {
    return this._as.slice(1)
  }

  static get idColumn () {
    return `${this._prefix}Id`
  }

  static get _idFull () {
    return `${this._as}.${this.idColumn}`
  }

  static get jsonSchema () {
    return { type: 'object' }
  }
}

module.exports = { Entity }
