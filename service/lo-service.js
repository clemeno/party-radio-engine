'use strict'

const { qbF, qbFCount, qbFOPList, qbFOCsv, csvNavHeaderDisplay, csvBusHeaderDisplay } = require('../repo/lo-repo')

const loFList = async ({ fastify, filtered = {}, bNav, bBus }) => ({ rows: await qbF({ filtered, bNav, bBus }) })

async function loFOPList ({ fastify, filtered = {}, ordered = [], paginated = {}, bNav, bBus }) {
  const { page, perPage } = paginated
  const { filteredCount } = await qbFCount({ filtered, bNav, bBus })
  const { qFOPList, normalizedPagination } = qbFOPList({ filtered, ordered, page, perPage, filteredCount, bNav, bBus })
  // , q: qFOPList.toKnexQuery().toSQL()
  return { rows: await qFOPList, normalizedPagination, statistics: { filteredCount } }
}

const loFOQbCsvNav = ({ fastify, filtered = {}, ordered = [] }) => ({
  qb: qbFOCsv({ filtered, ordered, bNav: true }),
  csvNavHeaderDisplay
})

const loFOQbCsvBus = ({ fastify, filtered = {}, ordered = [] }) => ({
  qb: qbFOCsv({ filtered, ordered, bBus: true }),
  csvBusHeaderDisplay
})

module.exports = { loFList, loFOPList, loFOQbCsvNav, loFOQbCsvBus }
