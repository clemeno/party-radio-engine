'use strict'

const bcrypt = require('bcrypt')

const encryptPassword = async clear => bcrypt.hash(`${clear}`, 12)
const comparePassword = async ({ clear, hash }) => bcrypt.compare(clear, hash)

module.exports = { encryptPassword, comparePassword }
