'use strict'

const { isNotEmptyString } = require('../utils/is-not-empty-string')
const { isNotEmptyArray } = require('../utils/is-not-empty-array')
const { whereIn } = require('../utils/where-in')
const { whereNotIn } = require('../utils/where-not-in')

const { normalizePagination, selectColumns, likeKeepPercentAndDash } = require('../utils/query-tools')

const { Ns } = require('../model/ns')
const { To } = require('../model/to')

const _ns = Ns._as
const _to = To._as

const _nsColumns = ['*']

const aliasColumns = {
  [_ns]: _nsColumns
}

const qbNs = () => Ns.query().alias(_ns)

const qbNsJoins = () => qbNs().leftJoin({ [_to]: To.tableName }, Ns._idFull, `${_to}.${Ns.idColumn}`)

const qbF = ({ filtered }) => {
  const qb = qbNsJoins().groupBy('_ns.nsId')

  const { formValues, bNav, excludeNsId } = filtered || {}

  if (bNav) {
    qb.where('_ns.nsTransport', '>', 0)
  }

  const {
    searchNsId,
    searchNsNumber,
    searchNsName
  } = formValues || {}

  if (isNotEmptyArray(excludeNsId)) {
    whereNotIn({ qb, column: '_ns.nsId', values: excludeNsId })
  }
  if (isNotEmptyArray(searchNsId)) {
    whereIn({ qb, column: '_ns.nsId', values: searchNsId })
  }

  if (isNotEmptyString(searchNsNumber)) {
    qb.where({ nsNumber: searchNsNumber })
  }

  if (isNotEmptyString(searchNsName)) {
    qb.where('_ns.nsName', 'like', `%${likeKeepPercentAndDash({ from: searchNsName })}%`)
  }

  return qb
}

const qbFCount = async ({ filtered }) => {
  const rows = await qbF({ filtered }).select('_ns.nsId')
  return { filteredCount: rows.length }
}

const qbFO = ({ filtered, ordered }) => qbF({ filtered }).orderBy(ordered)

const qbFOP = ({ filtered, ordered, page, perPage, filteredCount }) => {
  const normalizedPagination = normalizePagination({ page, perPage, filteredCount })
  const qFOP = qbFO({ filtered, ordered }).offset(normalizedPagination.normalizedOffset).limit(normalizedPagination.normalizedLimit)
  return { qFOP, normalizedPagination }
}

const qbFOPList = ({ filtered, ordered, page, perPage, filteredCount }) => {
  const { qFOP, normalizedPagination } = qbFOP({ filtered, ordered, page, perPage, filteredCount })
  return { qFOPList: qFOP.select(selectColumns(aliasColumns)), normalizedPagination }
}

const qbFList = ({ filtered }) => ({ qFList: qbF({ filtered }).select(selectColumns(aliasColumns)) })

module.exports = { qbFCount, qbFOPList, qbFList, qbF }
