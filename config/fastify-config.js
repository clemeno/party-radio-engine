'use strict'

// const fs = require('fs')
const path = require('path')

// const moment = require( 'moment-timezone' )

// const {
//   NODE_ENV
//   // , SSL_KEY, SSL_CERT
// } = require('../utils/env')

// const bDev = NODE_ENV === 'development'

const level = 'error'

module.exports = {
  ignoreTrailingSlash: true,
  caseSensitive: true,
  onProtoPoisoning: 'remove',
  onConstructorPoisoning: 'remove',
  // http2: true,
  // https: {
  //   allowHTTP1: true,
  //   key: SSL_KEY,
  //   cert: SSL_CERT
  //   // key: fs.readFileSync(path.join(__dirname, 'local.host', 'key.pem')),
  //   // cert: fs.readFileSync(path.join(__dirname, 'local.host', 'cert.pem'))
  // },
  logger: {
    prettyPrint: { translateTime: 'SYS:standard' },
    level,
    file: path.join(__dirname, '..', `${level}.log`),
    // prevent se fields from being logged
    redact: ['req.headers.authorization'],
    serializers: {
      res: res => ({
        statusCode: res.statusCode,
        details: res.details || res.message
      }),
      req: req => ({
        // moment: moment().format(),
        method: req.method,
        url: req.url,
        path: req.path,
        parameters: req.parameters,
        headers: req.headers,
        hostname: req.hostname,
        remoteAddress: req.ip,
        remotePort: req.connection.remotePort
      })
    }
  }
}
