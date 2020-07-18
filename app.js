'use strict'

const { LOCALE, TZ } = require('./utils/env')

const fastifyConfig = require('./config/fastify-config')

const moment = require('moment-timezone')
moment.locale(LOCALE)
moment.tz(TZ)

module.exports = (fastify, opts, next) => {
  // ADDITIONS

  // SERVED STATIC FILES
  fastify.register(require('fastify-static'), require('./config/fastify-static-config'))

  const { ppid, pid } = process
  const initLog = { started: [moment().format(), TZ, LOCALE, { ppid, pid }] }
  const initLogDisplay = JSON.stringify(initLog)
  console.log(initLogDisplay)

  // Make sure to call next when done
  next()
}

// FASTIFY CLI USING THE CONFIG LOADED FROM A JS MODULE
module.exports.options = fastifyConfig
