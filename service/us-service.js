'use strict'

const { Us } = require('../model/us')

const { qbPublishUsById, qbPatchAndFetchUsById, qbUsInsert, qbUsDeletebyId, qbFCount, qbFOPList } = require('../repo/us-repo')

const { isNumeric } = require('../utils/is-numeric')
const { isSet } = require('../utils/is-set')

// const { updatedJwt } = require('./jwt-service')

const { encryptPassword } = require('../utils/password')

// const { v4: uuidv4 } = require( 'uuid' )

const userAll = async () => ({ users: await Us.query().select(Us.publishColumnsWithoutPassword) })

async function userRead ({ fastify, usId }) {
  const user = isNumeric(usId) ? await qbPublishUsById(usId) : null
  fastify.assert(user, 404, JSON.stringify({ entity: Us._as, usId }))
  return { user }
}

async function userUpdate ({ fastify, oldJwt, oldUs, usId, keyValues = {} }) {
  let res = {}

  const ks = Object.keys(keyValues)

  if (ks.length) {
    const allowed = Us.publishColumns
    const unknown = ks.filter(k => !allowed.includes(k))
    fastify.assert(!unknown.length, 400, JSON.stringify({ unknown, allowed }))

    const patch = keyValues

    if (ks.includes('usPassword')) {
      const p = patch.usPassword
      const encryptedPassword = (p && ['string', 'number'].includes(typeof p)) ? await encryptPassword(p) : undefined
      patch.usPassword = encryptedPassword
    }

    let [error, user] = await fastify.to(qbPatchAndFetchUsById({ usId, patch }))
    fastify.assert(!error, 400, JSON.stringify({ usId, patch, error }))
    user = user ? Us.publish(user) : null

    // console.log({ user })

    res = { oldUs, patch, user }

    const { usId: adminId } = oldUs
    if (+adminId === +usId) {
      // , jwt: updatedJwt({ fastify, oldJwt, user })
      res = { ...res }
    }
  }

  return res
}

async function userCreate ({ fastify, keyValues }) {
  const kvs = { ...(keyValues || {}) }
  const required = Us.jsonSchema.required
  const missing = required.filter(k => !isSet(kvs[k]))
  fastify.assert(!missing.length, 400, JSON.stringify({ missing }))

  const allowed = Us.publishColumnsWithoutId
  const unknown = Object.keys(kvs).filter(k => !allowed.includes(k))
  fastify.assert(!unknown.length, 400, JSON.stringify({ unknown, required, allowed }))

  const p = kvs.usPassword
  const usPassword = (p && ['string', 'number'].includes(typeof p)) ? await encryptPassword(p) : undefined

  let [error, user] = await fastify.to(qbUsInsert({ ...kvs, usPassword: usPassword }))
  fastify.assert(!error, 400, JSON.stringify({ error }))
  user = user ? Us.publish(user) : null

  return { user }
}

async function userDelete ({ fastify, usId }) {
  const { user } = await userRead({ fastify, usId })
  const [error] = await fastify.to(qbUsDeletebyId(usId))
  fastify.assert(!error, 400, JSON.stringify({ usId, error }))
  return { user }
}

async function userFOPList ({ fastify, filtered = {}, ordered = [], paginated = {} }) {
  const { page, perPage } = paginated
  const { filteredCount } = await qbFCount({ filtered })
  const { qFOPList, normalizedPagination } = qbFOPList({ filtered, ordered, page, perPage, filteredCount })
  return { userList: await qFOPList, normalizedPagination, statistics: { filteredCount } }
}

module.exports = {
  userAll,
  userFOPList,
  userCreate,
  userRead,
  userUpdate,
  userDelete
}
