'use strict'

// const { Us } = require('../model/us')

// const {
//   newJwt
//   // ,
//   // freshJwt
// } = require('../service/jwt-service')

// const { comparePassword } = require('../utils/password')

// const { isSet } = require('../utils/is-set')

// const { v4: uuidv4 } = require('uuid')

const jwtController = async fastify => {
  // fastify.route({
  //   method: 'POST',
  //   url: '/public_jwt_new',
  //   handler: async request => {
  //     const { body } = request || {}
  //     const { account, password, b15Days } = body || {}

  //     const missing = [...(isSet(account) ? [] : ['account']), ...(isSet(password) ? [] : ['password'])]
  //     fastify.assert(!missing.length, 400, JSON.stringify({ missing }))

  //     const u = await Us
  //       .query()
  //       .select(Us.publishColumns)
  //       .orWhere({ usUsername: account })
  //       .orWhere({ usEmail: account })
  //       .limit(1)
  //       .first()
  //     const { usId, usPassword: passwordHash } = u || {}

  //     const bPasswordOk = u && !!+u.usEnabled && (await comparePassword({ clear: password, hash: passwordHash }))
  //     fastify.assert(bPasswordOk, 400, 'credentials')

  //     // const user = { ...u }
  //     // delete user.password

  //     // publish the id only (shorter jwt string token)

  //     const uuid = uuidv4()
  //     const jwt = newJwt({ fastify, b15Days, user: { usId } })
  //     return { uuid, jwt }
  //   }
  // })

  // fastify.route( {
  //   method: 'POST',
  //   url: '/jwt_refresh',
  //   handler: async ( request, reply ) => {
  //     const { user: oldJwt } = request
  //     const { user: oldUs } = oldJwt || {}
  //     fastify.assert( oldJwt && oldUs, 403, JSON.stringify( { error: request.jwtError } ) )
  //     const { id } = oldUs || {}
  //     const user = isSet( id ) ? Us.query().findById( id ) : null
  //     fastify.assert( user, 404, JSON.stringify( { entity: Us._as, id } ) )
  //     return { jwt: freshJwt( { fastify, oldJwt, user: { id } } ) }
  //   }
  // } )
}

module.exports = { jwtController }
