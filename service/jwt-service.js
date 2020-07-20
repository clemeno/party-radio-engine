'use strict'

const moment = require('moment-timezone')

const { isNumeric } = require('../utils/is-numeric')

function updatedJwt ({ fastify, oldJwt, user }) {
  let jwt = ''
  if (oldJwt && user) {
    const oldJwtWithoutIss = { ...oldJwt }
    delete oldJwtWithoutIss.iss
    const { usId } = user || {}
    jwt = fastify.jwt.sign({ ...oldJwtWithoutIss, iat: moment().unix(), user: { usId } })
  }
  return jwt
}

function newJwt ({ fastify, user, b15Days }) {
  const mIat = moment()
  const iat = mIat.unix()

  const days = b15Days ? 15 : 1

  const mExp = moment(mIat).add({ day: days })
  const exp = mExp.unix()

  const { usId } = user || {}

  return fastify.jwt.sign({ iat, exp, sub: user.username, days, user: { usId } })
}

function freshJwt ({ fastify, oldJwt, user }) {
  let jwt = ''
  if (oldJwt && user) {
    const mIat = moment()
    const iat = mIat.unix()

    const { days: oldDays } = oldJwt
    const days = isNumeric(oldDays) ? +oldDays : 1

    const mExp = moment(mIat).add({ day: days })
    const exp = mExp.unix()

    const { usId } = user

    jwt = fastify.jwt.sign({ ...oldJwt, iat, exp, days, user: { usId } })
  }
  return jwt
}

module.exports = { newJwt, freshJwt, updatedJwt }
