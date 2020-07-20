'use strict'

const { DB_DRIVER, DB_HOST, DB_USER, DB_PASSWORD, DB_USE } = require('../utils/env')

module.exports = {
  knexConfig: {
    client: DB_DRIVER,
    connection: { host: DB_HOST, database: DB_USE, user: DB_USER, password: DB_PASSWORD }
  },
  models: [
  ]
}
