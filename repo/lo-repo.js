'use strict'

const { normalizePagination, selectColumns, likeKeepPercentAndDash, selectColumnsInOrder } = require('../utils/query-tools')

const { isNotEmptyArray } = require('../utils/is-not-empty-array')
const { isNotEmptyString } = require('../utils/is-not-empty-string')

const moment = require('moment-timezone')
const { MYSQL_DT } = require('../utils/env')

const { whereIn } = require('../utils/where-in')

const { Lo } = require('../model/lo')
const { Eq } = require('../model/eq')
const { Eo } = require('../model/eo')
const { Es } = require('../model/es')

const { Ns } = require('../model/ns')
const { Nb } = require('../model/nb')

const _lo = Lo._as
const _eq = Eq._as
const _eo = Eo._as
const _es = Es._as

const _ns = Ns._as
const _nb = Nb._as

const _loColumns = ['loId', 'eqId', 'nbId', 'nsId', 'loName', 'loCreationDate', 'loLocation']
const _eqColumns = [
  'etId',
  'eqIdentifier',
  'eqName',
  'eqMode',
  'eqModeDate',
  'eqVerParams',
  'eqVerOffer',
  'eqVerLists'
]
const _eoColumns = ['eoLogicalsn']
const _esColumns = ['esSerial']

const aliasColumns = {
  [_lo]: _loColumns,
  [_eq]: _eqColumns,
  [_eo]: _eoColumns,
  [_es]: _esColumns
}

const _loCsvColumns = ['loName', 'loCreationDate']
const _eqCsvColumns = [
  'eqIdentifier',
  'eqName',
  'eqMode',
  'eqModeDate',
  'eqVerParams',
  'eqVerOffer',
  'eqVerLists'
]
const _eoCsvColumns = ['eoLogicalsn']
const _esCsvColumns = ['esSerial']
const _nsCsvColumns = ['nsName']
const _nbCsvColumns = ['nbIdentifier']

const aliasNavCsvColumns = {
  [_lo]: _loCsvColumns,
  [_eq]: _eqCsvColumns,
  [_eo]: _eoCsvColumns,
  [_es]: _esCsvColumns,
  [_ns]: _nsCsvColumns
}

const csvNavColumnsOrder = [
  'nsName',
  'loName',
  'eoLogicalsn',
  'eqIdentifier',
  'esSerial',
  'eqMode',
  'eqModeDate',
  'eqVerParams',
  'eqVerOffer',
  'eqVerLists',
  'loCreationDate'
]
const csvNavHeader = selectColumnsInOrder({ aliasColumns: aliasNavCsvColumns, order: csvNavColumnsOrder })

const csvNavHeaderDisplay = [
  'Station',
  'Location',
  'Logical ID',
  'Physical ID',
  'SAM',
  'Status',
  'Since',
  'Ver. param.',
  'Ver. offer',
  'Ver. lists',
  'Registered'
]

const aliasBusCsvColumns = {
  [_lo]: _loCsvColumns,
  [_eq]: _eqCsvColumns,
  [_eo]: _eoCsvColumns,
  [_es]: _esCsvColumns,
  [_nb]: _nbCsvColumns
}

const csvBusColumnsOrder = [
  'nbIdentifier',
  'loName',
  'eoLogicalsn',
  'eqIdentifier',
  'esSerial',
  'eqMode',
  'eqModeDate',
  'eqVerParams',
  'eqVerOffer',
  'eqVerLists',
  'loCreationDate'
]
const csvBusHeader = selectColumnsInOrder({ aliasColumns: aliasBusCsvColumns, order: csvBusColumnsOrder })

const csvBusHeaderDisplay = [
  'Station',
  'Location',
  'Logical ID',
  'Physical ID',
  'SAM',
  'Status',
  'Since',
  'Ver. param.',
  'Ver. offer',
  'Ver. lists',
  'Registered'
]

const qbLo = () => Lo.query().alias(_lo)

const qbLoJoins = () => qbLo()
  .leftJoin({ [_eq]: Eq.tableName }, `${_lo}.${Eq.idColumn}`, `${_eq}.${Eq.idColumn}`)
  .leftJoin({ [_eo]: Eo.tableName }, `${_lo}.${Eq.idColumn}`, `${_eo}.${Eq.idColumn}`)
  .leftJoin({ [_es]: Es.tableName }, `${_lo}.${Eq.idColumn}`, `${_es}.${Eq.idColumn}`)

const qbLoJoinsNavCsv = () => qbLoJoins().leftJoin({ [_ns]: Ns.tableName }, `${_lo}.${Ns.idColumn}`, Ns._idFull)
const qbLoJoinsBusCsv = () => qbLoJoins().leftJoin({ [_nb]: Nb.tableName }, `${_lo}.${Nb.idColumn}`, Nb._idFull)

const qbF = ({ filtered, bCsv, bNav, bBus }) => {
  const qb = bCsv ? (bNav ? qbLoJoinsNavCsv() : qbLoJoinsBusCsv()) : qbLoJoins()

  // do not display hidden terminals
  qb.where('loHidden', '!=', 1)

  const { formValues } = filtered
  const {
    searchEqId,
    searchNbId,
    searchNsId,
    searchLoName,
    searchEsSerial,
    searchEoLogicalsn,
    searchEqIdentifier,
    searchEqMode,
    searchLoCreationDateMinMoment,
    searchLoCreationDateMaxMoment
  } = formValues || {}

  if (bNav) {
    qb.whereNotNull('_lo.nsId')
  }

  if (bBus) {
    qb.whereNotNull('_lo.nbId')
  }

  if (isNotEmptyArray(searchEqId)) {
    whereIn({ qb, column: '_lo.eqId', values: searchEqId })
  }

  if (isNotEmptyArray(searchNbId)) {
    whereIn({ qb, column: '_lo.nbId', values: searchNbId })
  }

  if (isNotEmptyArray(searchNsId)) {
    whereIn({ qb, column: '_lo.nsId', values: searchNsId })
  }

  if (isNotEmptyString(searchLoName)) {
    qb.where('_lo.loName', 'like', `%${likeKeepPercentAndDash({ from: searchLoName })}%`)
  }

  if (isNotEmptyString(searchEsSerial)) {
    qb.where('_es.esSerial', `${+`0x${searchEsSerial}`}`)
  }

  if (isNotEmptyString(searchEoLogicalsn)) {
    qb.where('_eo.eoLogicalsn', 'like', `%${likeKeepPercentAndDash({ from: searchEoLogicalsn })}%`)
  }

  if (isNotEmptyString(searchEqIdentifier)) {
    qb.where('_eq.eqIdentifier', 'like', `%${likeKeepPercentAndDash({ from: searchEqIdentifier })}%`)
  }

  if (isNotEmptyArray(searchEqMode)) {
    whereIn({ qb, column: '_eq.eqMode', values: searchEqMode })
  }

  if (isNotEmptyString(searchLoCreationDateMinMoment)) {
    qb.where('_lo.loCreationDate', '>=', moment(searchLoCreationDateMinMoment).format(MYSQL_DT))
  }

  if (isNotEmptyString(searchLoCreationDateMaxMoment)) {
    qb.where('_lo.loCreationDate', '<=', moment(searchLoCreationDateMaxMoment).format(MYSQL_DT))
  }

  return qb
}

const qbFCount = ({ filtered, bNav, bBus }) => qbF({ filtered, bNav, bBus }).count({ filteredCount: '*' }).first()

const qbFO = ({ filtered, ordered, bCsv, bNav, bBus }) => qbF({ filtered, bCsv, bNav, bBus }).orderBy(ordered)

const qbFOP = ({ filtered, ordered, page, perPage, filteredCount, bNav, bBus }) => {
  const normalizedPagination = normalizePagination({ page, perPage, filteredCount })
  const qFOP = qbFO({ filtered, ordered, bNav, bBus }).offset(normalizedPagination.normalizedOffset).limit(normalizedPagination.normalizedLimit)
  return { qFOP, normalizedPagination }
}

const qbFOPList = ({ filtered, ordered, page, perPage, filteredCount, bNav, bBus }) => {
  const { qFOP, normalizedPagination } = qbFOP({ filtered, ordered, page, perPage, filteredCount, bNav, bBus })
  return { qFOPList: qFOP.select(selectColumns(aliasColumns)), normalizedPagination }
}

const qbFOCsv = ({ filtered, ordered, bNav, bBus }) => qbFO({ filtered, ordered, bCsv: true, bNav, bBus })
  .select(bNav ? csvNavHeader : csvBusHeader)

module.exports = { qbF, qbFCount, qbFOPList, qbFOCsv, csvNavHeaderDisplay, csvBusHeaderDisplay }
