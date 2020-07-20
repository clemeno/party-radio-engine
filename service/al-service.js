'use strict'

const { qbFCount, qbFOPList, qbNbUnderAl, qbNsUnderAl, qbEqUnderAlCount, qbFOCsv, csvHeaderDisplay } = require('../repo/al-repo')

const alFOPList = async ({ fastify, filtered = {}, ordered = [], paginated = {} }) => {
  const { page, perPage } = paginated
  const { filteredCount } = await qbFCount({ filtered })
  const { qFOPList, normalizedPagination } = qbFOPList({ filtered, ordered, page, perPage, filteredCount })
  // , q: qFOPList.toKnexQuery().toSQL()
  return { rows: await qFOPList, normalizedPagination, statistics: { filteredCount } }
}

const nbUnderAl = () => qbNbUnderAl()
const nsUnderAl = () => qbNsUnderAl()

const eqUnderAlCount = q => qbEqUnderAlCount(q)

const alFOQbCsv = ({ fastify, filtered = {}, ordered = [] }) => ({
  qb: qbFOCsv({ filtered, ordered }),
  csvHeaderDisplay
})

module.exports = { alFOPList, nbUnderAl, nsUnderAl, eqUnderAlCount, alFOQbCsv }
