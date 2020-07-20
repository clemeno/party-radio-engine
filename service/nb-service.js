'use strict'

const { qbFCount, qbFOPList, qbFList } = require('../repo/nb-repo')

async function nbFOPList ({ fastify, filtered = {}, ordered = [], paginated = {} }) {
  const { page, perPage } = paginated
  const { filteredCount } = await qbFCount({ filtered })
  const { qFOPList, normalizedPagination } = qbFOPList({ filtered, ordered, page, perPage, filteredCount })
  // , q: qFOPList.toKnexQuery().toSQL()
  return { rows: await qFOPList, normalizedPagination, statistics: { filteredCount } }
}

async function nbFList ({ fastify, filtered = {} }) {
  const { qFList } = qbFList({ filtered })
  // , q: qFList.toKnexQuery().toSQL()
  return { rows: await qFList }
}

module.exports = { nbFOPList, nbFList }
