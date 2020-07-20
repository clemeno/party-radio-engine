'use strict'

const { qbFCount, qbFOPList, qbFList } = require('../repo/cg-repo')

async function cgFOPList ({ fastify, filtered = {}, ordered = [], paginated = {} }) {
  const { page, perPage } = paginated
  const { filteredCount } = await qbFCount({ filtered })
  const { qFOPList, normalizedPagination } = qbFOPList({ filtered, ordered, page, perPage, filteredCount })
  return { rows: await qFOPList, normalizedPagination, statistics: { filteredCount } }
}

async function cgFList ({ fastify, filtered = {} }) {
  const { qFList } = qbFList({ filtered })
  return { rows: await qFList }
}

module.exports = { cgFOPList, cgFList }
