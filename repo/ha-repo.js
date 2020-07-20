'use strict'

const { normalizePagination, likeKeepPercentAndDash } = require('../utils/query-tools')

const { isNotEmptyString } = require('../utils/is-not-empty-string')
const { isNotEmptyArray } = require('../utils/is-not-empty-array')

const { whereIn } = require('../utils/where-in')

const { Ha } = require('../model/ha')

const _ha = Ha._as

const _haColumns = [
  'haId',
  'haDate',
  'haCode',
  'haActorServer',
  'haActorEmail',
  'haActorPhone',
  'haDetails'
]

const qbHa = () => Ha.query().alias(_ha)

const qbF = ({ filtered }) => {
  const qb = qbHa()

  const { formValues } = filtered
  const { searchAccount, searchAction } = formValues || {}

  if (isNotEmptyString(searchAccount)) {
    qb.where('haActorEmail', 'like', `%${likeKeepPercentAndDash({ from: searchAccount })}%`)
  }

  if (isNotEmptyArray(searchAction)) {
    whereIn({ qb, column: 'haCode', values: searchAction })
  }

  return qb
}

const qbFCount = ({ filtered }) => qbF({ filtered }).count({ filteredCount: '*' }).first()

const qbFO = ({ filtered, ordered }) => qbF({ filtered }).orderBy(ordered)

const qbFOP = ({ filtered, ordered, page, perPage, filteredCount }) => {
  const normalizedPagination = normalizePagination({ page, perPage, filteredCount })
  const qFOP = qbFO({ filtered, ordered }).offset(normalizedPagination.normalizedOffset).limit(normalizedPagination.normalizedLimit)
  return { qFOP, normalizedPagination }
}

const qbFOPList = ({ filtered, ordered, page, perPage, filteredCount }) => {
  const { qFOP, normalizedPagination } = qbFOP({ filtered, ordered, page, perPage, filteredCount })
  return { qFOPList: qFOP.select(_haColumns), normalizedPagination }
}

module.exports = { qbFCount, qbFOPList }
