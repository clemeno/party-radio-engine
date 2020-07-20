'use strict'

const { qbFCount, qbFOPList } = require('../repo/op-repo')

async function opFOPList ({ fastify, filtered = {}, ordered = [], paginated = {} }) {
  const { page, perPage } = paginated
  const { filteredCount } = await qbFCount({ filtered })
  const { qFOPList, normalizedPagination } = qbFOPList({ filtered, ordered, page, perPage, filteredCount })
  // , q: qFOPList.toKnexQuery().toSQL()
  return { rows: await qFOPList, normalizedPagination, statistics: { filteredCount } }
}

module.exports = { opFOPList }
