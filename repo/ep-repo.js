'use strict'

const { normalizePagination, likeKeepPercentAndDash, selectColumns } = require('../utils/query-tools')

const { isNotEmptyArray } = require('../utils/is-not-empty-array')
const { isNotEmptyString } = require('../utils/is-not-empty-string')

const { whereIn } = require('../utils/where-in')

const moment = require('moment-timezone')
const { MYSQL_DT } = require('../utils/env')

const { Ep } = require('../model/ep')
const { Et } = require('../model/et')

const _ep = Ep._as
const _et = Et._as

const _epColumns = ['*']
const _etColumns = ['*']

const aliasColumns = {
  [_ep]: _epColumns,
  [_et]: _etColumns
}

const qbEp = () => Ep.query().alias(_ep)

const qbEpJoined = () => qbEp().leftJoin({ [_et]: Et.tableName }, `${_ep}.epVerParams`, `${_et}.etDefaultParam`)

const qbF = ({ filtered }) => {
  const qb = qbEpJoined()

  const { formValues } = filtered || {}

  const {
    searchEpLocked,
    searchEpVersion,
    searchEpCreationDateMinMoment,
    searchEpCreationDateMaxMoment,
    searchEpDescription,
    searchEtDefaultParam,
    searchEtType
  } = formValues || {}

  if (isNotEmptyArray(searchEpLocked)) {
    whereIn({ qb, column: '_ep.epLocked', values: searchEpLocked })
  }

  if (isNotEmptyString(searchEpVersion)) {
    qb.where('_ep.epVerParams', 'like', `%${likeKeepPercentAndDash({ from: searchEpVersion })}%`)
  }

  if (isNotEmptyString(searchEpCreationDateMinMoment)) {
    qb.where('_ep.epCreationDate', '>=', moment(searchEpCreationDateMinMoment).format(MYSQL_DT))
  }

  if (isNotEmptyString(searchEpCreationDateMaxMoment)) {
    qb.where('_ep.epCreationDate', '<=', moment(searchEpCreationDateMaxMoment).format(MYSQL_DT))
  }

  if (isNotEmptyString(searchEpDescription)) {
    qb.where('_ep.epDescription', 'like', `%${likeKeepPercentAndDash({ from: searchEpDescription })}%`)
  }

  if (isNotEmptyArray(searchEtDefaultParam)) {
    const bOn = searchEtDefaultParam.includes(1)
    const bOff = searchEtDefaultParam.includes(0)
    if (bOn && !bOff) {
      qb.whereNotNull('_et.etDefaultParam')
    }
    if (!bOn && bOff) {
      qb.whereNull('_et.etDefaultParam')
    }
  }

  if (isNotEmptyArray(searchEtType)) {
    whereIn({ qb, column: '_et.etType', values: searchEtType })
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

module.exports = { qbFCount, qbFOPList }
