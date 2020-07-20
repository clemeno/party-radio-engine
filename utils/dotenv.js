'use strict'

const dotenv = require('dotenv').config()
const { parsed } = dotenv || {}

module.exports = parsed || {}
