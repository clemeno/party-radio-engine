'use strict'

const { qbFCount, qbFOPList } = require('../repo/ha-repo')

async function haFOPList ({ fastify, filtered = {}, ordered = [], paginated = {} }) {
  const { page, perPage } = paginated
  const { filteredCount } = await qbFCount({ filtered })
  const { qFOPList, normalizedPagination } = qbFOPList({ filtered, ordered, page, perPage, filteredCount })
  return { rows: await qFOPList, normalizedPagination, statistics: { filteredCount } }
}

module.exports = { haFOPList }
