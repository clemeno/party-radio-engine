'use strict'

const { LOCALE, LANG, GEO, TZ, DTS } = require('../utils/env')

const moment = require('moment-timezone')

const serverController = async fastify => {
  fastify.route({
    method: 'GET',
    url: '/server_info',
    handler: async () => {
      const mNow = moment()
      const TIMESTAMP_S = mNow.unix()
      const TIMESTAMP_MS = mNow.valueOf()
      const TIMESTAMP_ISO = mNow.toISOString()
      const DISPLAY_DTS = mNow.format(DTS)
      return {
        TIMESTAMP_S,
        TIMESTAMP_MS,
        TIMESTAMP_ISO,
        LANG,
        GEO,
        LOCALE,
        TZ,
        DISPLAY_DTS
      }
    }
  })
}

module.exports = { serverController }
