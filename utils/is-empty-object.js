'use strict'

module.exports = { isEmptyObject: o => (o !== null) && ((typeof o) === 'object') && !Object.keys(o).length }
