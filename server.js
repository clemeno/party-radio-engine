'use strict'

const { SERVER_LISTEN_PORT, SERVER_LISTEN_ORIGIN } = require('./utils/env')

const app = require('./app')
const fastify = require('fastify')(app.options)

process.on('unhandledRejection', err => {
  console.log(err)
  fastify.log.error(err)
})

fastify.register(app)

fastify.listen(
  SERVER_LISTEN_PORT || 43210,
  SERVER_LISTEN_ORIGIN || '::',
  err => {
    if (err) {
      console.log(err)
      fastify.log.error(err)
      process.exit(1)
    }
  }
)
