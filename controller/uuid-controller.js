'use strict'

const { v4: uuidv4 } = require('uuid')

const uuidController = async fastify => {
  fastify.route({ method: 'POST', url: '/uuid_new', handler: async () => ({ uuid: uuidv4() }) })
}

module.exports = { uuidController }
