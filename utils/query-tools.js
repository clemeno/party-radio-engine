'use strict'

const { isNumeric } = require('../utils/is-numeric')

/**
 * @param {{ n: number, min?: number = 1, max?: number = 1, def?: number = 1 }}
 * @returns {number}
 */
const normalizeN1 = ({ n, min = 1, max = 1, def = 1 }) => isNumeric(n) ? Math.max(min, Math.min(+n, max)) : def

const normalizePerPage = perPage => normalizeN1({ n: perPage, max: Number.MAX_SAFE_INTEGER })
const normalizePages = ({ normalizedPerPage, filteredCount }) => Math.ceil((filteredCount || 1) / (normalizedPerPage || 1))
const normalizePage = ({ page, normalizedPages }) => normalizeN1({ n: page, max: normalizedPages })

const normalizeOffset = ({ normalizedPage, normalizedPerPage }) => (normalizedPage - 1) * normalizedPerPage
const normalizeLimit = normalizedPerPage => normalizedPerPage

const normalizePagination = ({ page, perPage, filteredCount }) => {
  const normalizedPerPage = normalizePerPage(perPage)
  const normalizedPages = normalizePages({ normalizedPerPage, filteredCount })
  const normalizedPage = normalizePage({ page, normalizedPages })
  const normalizedOffset = normalizeOffset({ normalizedPage, normalizedPerPage })
  const normalizedLimit = normalizeLimit(normalizedPerPage)
  return { normalizedPage, normalizedPerPage, normalizedPages, normalizedOffset, normalizedLimit }
}

/**
 * @param {{ [ alias: string ]: string[] }} aliasColumns
 * @returns {string[]}
 */
const selectColumns = aliasColumns => Object.entries(aliasColumns).reduce(
  (select, [alias, columns]) => [...select, ...columns.map(column => `${alias}.${column}`)],
  []
)

const selectColumnsInOrder = ({ aliasColumns, order }) => {
  const aliasColumnsEntries = Object.entries(aliasColumns)
  return order.reduce(
    (select, column) => {
      const [alias] = aliasColumnsEntries.find(([alias, columns]) => columns.includes(column)) || []
      if (alias) {
        select.push(`${alias}.${column}`)
      }
      return select
    },
    []
  )
}

const likeKeepPercentAndDash = ({ from, escapeWith }) => {
  const esc = escapeWith || '\\'
  return (
    ((typeof from) === 'string')
      ? `${from}`.split(esc).join(`${esc}${esc}`).replace(/%/g, `${esc}%`).replace(/_/g, `${esc}_`)
      : ''
  )
}

module.exports = {
  normalizeN1,

  normalizePerPage,
  normalizePages,
  normalizePage,

  normalizeOffset,
  normalizeLimit,

  normalizePagination,

  selectColumns,
  selectColumnsInOrder,

  likeKeepPercentAndDash
}
