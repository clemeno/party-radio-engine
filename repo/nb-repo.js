'use strict'

const { isNotEmptyString } = require('../utils/is-not-empty-string')
const { isNotEmptyArray } = require('../utils/is-not-empty-array')
const { whereIn } = require('../utils/where-in')
const { whereNotIn } = require('../utils/where-not-in')

const { normalizePagination, selectColumns, likeKeepPercentAndDash } = require('../utils/query-tools')

const { Nb } = require('../model/nb')

const _nb = Nb._as

const _nbColumns = ['*']

const aliasColumns = {
  [_nb]: _nbColumns
}

const qbNb = () => Nb.query().alias(_nb)

const qbF = ({ filtered }) => {
  const qb = qbNb()

  const { formValues, excludeNbId } = filtered || {}

  const {
    searchNbId,
    searchNbNumber,
    searchNbIdentifier
  } = formValues || {}

  if (isNotEmptyArray(excludeNbId)) {
    whereNotIn({ qb, column: '_nb.nbId', values: excludeNbId })
  }
  if (isNotEmptyArray(searchNbId)) {
    whereIn({ qb, column: '_nb.nbId', values: searchNbId })
  }

  if (isNotEmptyString(searchNbNumber)) {
    qb.where('_nb.nbNumber', '=', searchNbNumber)
  }

  if (isNotEmptyString(searchNbIdentifier)) {
    qb.where('_nb.nbIdentifier', 'like', `%${likeKeepPercentAndDash({ from: searchNbIdentifier })}%`)
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
  return { qFOPList: qFOP.select(selectColumns(aliasColumns)), normalizedPagination }
}

const qbFList = ({ filtered }) => ({ qFList: qbF({ filtered }).select(selectColumns(aliasColumns)) })

module.exports = { qbFCount, qbFOPList, qbFList, qbF }
