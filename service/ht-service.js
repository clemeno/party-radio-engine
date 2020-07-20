'use strict'

const { qbFCount, qbFOPList, qbFList, qbFOCsv, csvHeaderDisplay, csvHeaderDisplayLoads } = require('../repo/ht-repo')

async function htFOPList ({ fastify, filtered = {}, ordered = [], paginated = {} }) {
  const { page, perPage } = paginated
  const { filteredCount } = await qbFCount({ filtered })
  const { qFOPList, normalizedPagination } = qbFOPList({ filtered, ordered, page, perPage, filteredCount })
  return { rows: await qFOPList, normalizedPagination, statistics: { filteredCount } }
}

async function htFList ({ fastify, filtered = {} }) {
  const { qFList } = qbFList({ filtered })
  return { rows: await qFList }
}

const htFOQbCsv = ({ fastify, filtered = {}, ordered = [], bLoads }) => ({
  qb: qbFOCsv({ filtered, ordered }),
  csvHeaderDisplay: bLoads ? csvHeaderDisplayLoads : csvHeaderDisplay
})

module.exports = { htFOPList, htFList, htFOQbCsv }
