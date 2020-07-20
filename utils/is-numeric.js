'use strict'

// NaN -> false
// 'NaN' -> false
// '' -> false
const isNumeric = x => (
  (((typeof x) === 'number') && ((x - x) === 0)) ||
  (((typeof x) === 'string') && (x !== '') && ((+x - +x) === 0))
)

module.exports = { isNumeric }
