'use strict'

const { LOCALE, TZ } = require('./utils/env')

const path = require('path')

const moment = require('moment-timezone')
moment.locale(LOCALE)
moment.tz(TZ)

const AutoLoad = require('fastify-autoload')

const fastifyConfig = require('./config/fastify-config')

module.exports = (fastify, opts, next) => {
  // ADDITIONS
  fastify.register(require('fastify-sensible'))

  // // ORM
  // fastify.register(require('fastify-objectionjs'), require('./config/fastify-objectionjs-config'))

  // JWT
  fastify.register(require('fastify-jwt'), require('./config/fastify-jwt-config'))

  // COMPRESSION
  fastify.register(require('fastify-compress'), require('./config/fastify-compress-config'))

  // HTTP SERVER SECURITY
  fastify.register(require('fastify-helmet'), require('./config/fastify-helmet-config'))

  // CORS
  fastify.register(require('fastify-cors'), require('./config/fastify-cors-config'))

  // AUTO LOAD UTILS
  // This loads all plugins defined in plugins those should be support plugins that are reused through your application
  fastify.register(AutoLoad, { dir: path.join(__dirname, 'plugins'), options: { ...opts } })

  // EXPLICIT LOAD UTILS

  // ROUTING
  fastify.register(require('fastify-routes'))

  // EXPLICIT LOAD ROUTING

  const api = [
    'root',
    'server',
    'app'
  ]
  api.map(s => require(`./controller/${s}-controller`)[`${s}Controller`]).forEach(c => fastify.register(c))

  // SERVED STATIC FILES
  const fastifyStatic = require('fastify-static')
  fastify.register(fastifyStatic, require('./config/fastify-static-spiradio-config'))

  const { ppid, pid } = process
  const initLog = { started: [moment().format(), TZ, LOCALE, { ppid, pid }] }
  const initLogDisplay = JSON.stringify(initLog)
  console.log(initLogDisplay)
  // console.error( initLogDisplay )
  // fastify.log.error(initLogDisplay)

  // Make sure to call next when done
  next()
}

// FASTIFY CLI USING THE CONFIG LOADED FROM A JS MODULE
module.exports.options = fastifyConfig
