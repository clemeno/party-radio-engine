'use strict'

module.exports = { isNotEmptyObject: v => ((typeof {}) === (typeof v)) && Object.keys(v).length }
