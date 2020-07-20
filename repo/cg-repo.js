'use strict'

const { normalizePagination, selectColumns } = require('../utils/query-tools')

const { isNotEmptyArray } = require('../utils/is-not-empty-array')
const { isNotEmptyString } = require('../utils/is-not-empty-string')
const { isNumeric } = require('../utils/is-numeric')
const { whereIn } = require('../utils/where-in')
const { fromBase16To10 } = require('../utils/base-converter')

const moment = require('moment-timezone')
const { MYSQL_DT } = require('../utils/env')

const { Cg } = require('../model/cg')

const _cg = Cg._as

const _cgColumns = [
  'cgId',
  'cgCreationDate',
  'cgUpdate',
  'cgCardSerial',
  'cgCardType',
  'cgRetries',
  'cgDisabled'
]

const aliasColumns = { [_cg]: _cgColumns }

const qbCg = () => Cg.query().alias(_cg)

const qbF = ({ filtered }) => {
  const qb = qbCg()

  const { formValues } = filtered || {}

  const {
    searchCgCreatedMinMoment,
    searchCgCreatedMaxMoment,
    searchCgUpdatedMinMoment,
    searchCgUpdatedMaxMoment,
    searchCgCardSerial,
    searchCgCardType,
    searchCgRetries,
    searchCgDisabled
  } = formValues || {}

  if (isNotEmptyString(searchCgCreatedMinMoment)) {
    const m = moment(searchCgCreatedMinMoment)
    if (m.isValid()) {
      qb.where('cgCreationDate', '>=', m.format(MYSQL_DT))
    }
  }

  if (isNotEmptyString(searchCgCreatedMaxMoment)) {
    const m = moment(searchCgCreatedMaxMoment)
    if (m.isValid()) {
      qb.where('cgCreationDate', '<=', m.format(MYSQL_DT))
    }
  }

  if (isNotEmptyString(searchCgUpdatedMinMoment)) {
    const m = moment(searchCgUpdatedMinMoment)
    if (m.isValid()) {
      qb.where('cgUpdate', '>=', m.format(MYSQL_DT))
    }
  }

  if (isNotEmptyString(searchCgUpdatedMaxMoment)) {
    const m = moment(searchCgUpdatedMaxMoment)
    if (m.isValid()) {
      qb.where('cgUpdate', '<=', m.format(MYSQL_DT))
    }
  }

  if (isNotEmptyString(searchCgCardSerial)) {
    qb.where({ cgCardSerial: fromBase16To10(`${searchCgCardSerial}`.replace(/ +/g, '').toLocaleLowerCase()) })
  }

  if (isNotEmptyArray(searchCgCardType)) {
    whereIn({ qb, column: 'cgCardType', values: searchCgCardType })
  }

  if (isNumeric(searchCgRetries)) {
    qb.where({ cgRetries: searchCgRetries })
  }

  if (isNotEmptyArray(searchCgDisabled)) {
    whereIn({ qb, column: 'cgDisabled', values: searchCgDisabled })
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

const qbFList = ({ filtered }) => ({ qFOPList: qbF({ filtered }).select(selectColumns(aliasColumns)) })

module.exports = { qbFCount, qbFOPList, qbFList }
