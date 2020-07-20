'use strict'

/**
 * @param { { object: any, depth?: number } } _
 */
const trimObject = _ => {
  const res = _.object
  const depth = _.depth || Number.MAX_SAFE_INTEGER

  res && Object.keys(res).forEach(k => {
    if (((typeof res[k]) === 'undefined') || (res[k] === null)) {
      delete res[k]
    } else if (depth > 0) {
      if (Array.isArray(res[k])) {
        res[k] = res[k].map(row => trimObject({ object: row, depth: depth - 1 }))
      } else if ((typeof res[k]) === 'object') {
        trimObject({ object: res[k], depth: depth - 1 })
      }
    }
  })

  return res
}

module.exports = { trimObject }
