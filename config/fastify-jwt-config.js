'use strict'

const { JWT_SECRET, JWT_ALG, JWT_ISS } = require('../utils/env')

const secret = JWT_SECRET

const algorithm = JWT_ALG

const issuer = JWT_ISS

const messages = {
  badRequestErrorMessage: 'token_header_format_§_{ Authorization: \'Bearer \' + token }',
  noAuthorizationInHeaderMessage: 'token_header_missing',
  authorizationTokenExpiredMessage: 'token_header_expired',
  authorizationTokenInvalid: err => `token_header_invalid_§_${err.name}_§_${err.message}`,
  authorizationTokenUntrusted: 'token_header_untrusted'
}

module.exports = { secret, sign: { algorithm, issuer }, verify: { issuer }, messages }
