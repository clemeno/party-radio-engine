'use strict'

const { normalizePagination, selectColumns, selectColumnsInOrder } = require('../utils/query-tools')

const { isNotEmptyArray } = require('../utils/is-not-empty-array')
const { isNotEmptyString } = require('../utils/is-not-empty-string')

const moment = require('moment-timezone')
const { MYSQL_DT } = require('../utils/env')

const { whereIn } = require('../utils/where-in')

const { Ht } = require('../model/ht')
const { Lo } = require('../model/lo')
const { Eq } = require('../model/eq')
const { Eo } = require('../model/eo')
const { Ns } = require('../model/ns')
const { Nb } = require('../model/nb')
const { Op } = require('../model/op')
const { Li } = require('../model/li')

const _ht = Ht._as
const _lo = Lo._as
const _eq = Eq._as
const _eo = Eo._as
const _ns = Ns._as
const _nb = Nb._as
const _op = Op._as
const _li = Li._as

const _htColumns = [
  'htId',
  'htDatetime',
  'htType',
  'htStatus',
  'htSamSerial',
  'htCardType',
  'htProfile',
  'htLocation',
  'eqId',
  'nsId',
  'htQrId',
  'htContract'
]
const _htColumnsLoads = [
  'htId',
  'htDatetime',
  'htStatus',
  'htLocation',
  'nsId',
  'eqId',
  'htSamSerial',
  'htContract',
  'htContractevd',
  'liId'
]
const _loColumns = ['loName', 'nbId']
// const _eqColumns = ['etId', 'eqIdentifier']
// const _eoColumns = ['eoLogicalsn']
const _liColumns = ['liReloadingId']

const aliasColumns = {
  [_ht]: _htColumns,
  [_lo]: _loColumns
  // [_eq]: _eqColumns,
  // [_eo]: _eoColumns
}
const aliasColumnsLoads = {
  [_ht]: _htColumnsLoads,
  [_lo]: _loColumns,
  // [_eq]: _eqColumns,
  // [_eo]: _eoColumns,
  [_li]: _liColumns
}

const _htCsvColumns = [
  'htDatetime',
  'htType',
  'htStatus',
  'htCardType',
  'htProfile',
  'htLocation',
  'htQrId',
  'htSamSerial'
]
const _htCsvColumnsLoads = [
  'htDatetime',
  'htStatus',
  'htLocation',
  'htSamSerial',
  'htContract',
  'htContractevd'
]
const _loCsvColumns = ['loName']
const _eqCsvColumns = ['eqIdentifier']
const _eoCsvColumns = ['eoLogicalsn']
const _nsCsvColumns = ['nsName']
const _nbCsvColumns = ['nbIdentifier']
const _opCsvColumns = ['opCode', 'opName']
const _liCsvColumns = ['liReloadingId']

const csvColumns = {
  [_ht]: _htCsvColumns,
  [_lo]: _loCsvColumns,
  [_eq]: _eqCsvColumns,
  [_eo]: _eoCsvColumns,
  [_ns]: _nsCsvColumns,
  [_nb]: _nbCsvColumns,
  [_op]: _opCsvColumns
}
const csvColumnsLoads = {
  [_ht]: _htCsvColumnsLoads,
  [_lo]: _loCsvColumns,
  [_eq]: _eqCsvColumns,
  [_eo]: _eoCsvColumns,
  [_ns]: _nsCsvColumns,
  [_nb]: _nbCsvColumns,
  [_op]: _opCsvColumns,
  [_li]: _liCsvColumns
}

const csvColumnsOrder = [
  'htDatetime',
  'htType',
  'htStatus',
  'opCode',
  'opName',
  'htQrId',
  'htCardType',
  'htProfile',
  'loName',
  'htLocation',
  'eqIdentifier',
  'eoLogicalsn',
  'htSamSerial',
  'nsName',
  'nbIdentifier'
]
const csvColumnsOrderLoads = [
  'htDatetime',
  'htStatus',
  'opCode',
  'opName',
  'htContractevd',
  'liReloadingId',
  'loName',
  'htLocation',
  'eqIdentifier',
  'eoLogicalsn',
  'htSamSerial',
  'nsName',
  'nbIdentifier'
]

const csvHeader = selectColumnsInOrder({ aliasColumns: csvColumns, order: csvColumnsOrder })
const csvHeaderLoads = selectColumnsInOrder({ aliasColumns: csvColumnsLoads, order: csvColumnsOrderLoads })

const csvHeaderDisplay = [
  'Date',
  'Type',
  'Status',
  'Product',
  'Name',
  'QR Code',
  'Card',
  'Profile',
  'Terminal',
  'Location',
  'Physical ID',
  'Logical ID',
  'SAM',
  'Station',
  'Bus'
]

const csvHeaderDisplayLoads = [
  'Date',
  'Status',
  'Product',
  'Name',
  'Validity Stop',
  'Reloading ID',
  'Terminal',
  'Location',
  'Physical ID',
  'Logical ID',
  'SAM',
  'Station',
  'Bus'
]

const qbHt = () => Ht.query().alias(_ht)

const qbJoined = () => qbHt().leftJoin({ [_lo]: Lo.tableName }, `${_ht}.htLocation`, `${_lo}.loLocation`)

const qbJoinedLoads = () => qbJoined().leftJoin({ [_li]: Li.tableName }, `${_ht}.${Li.idColumn}`, Li._idFull)

const qbCsvJoined = () => qbJoined()
  .leftJoin({ [_eq]: Eq.tableName }, `${_ht}.${Eq.idColumn}`, Eq._idFull)
  .leftJoin({ [_eo]: Eo.tableName }, `${_ht}.${Eq.idColumn}`, `${_eo}.${Eq.idColumn}`)
  .leftJoin({ [_ns]: Ns.tableName }, `${_ht}.${Ns.idColumn}`, Ns._idFull)
  .leftJoin({ [_nb]: Nb.tableName }, `${_lo}.${Nb.idColumn}`, Nb._idFull)
  .leftJoin({ [_op]: Op.tableName }, `${_ht}.htContract`, `${_op}.opCode`)

const qbCsvJoinedLoads = () => qbCsvJoined().leftJoin({ [_li]: Li.tableName }, `${_ht}.${Li.idColumn}`, Li._idFull)

const qbF = ({ filtered, bCsv, bLoads }) => {
  const qb = bLoads ? (bCsv ? qbCsvJoinedLoads() : qbJoinedLoads()) : (bCsv ? qbCsvJoined() : qbJoined())

  const { formValues } = filtered || {}
  const {
    searchNbId,
    searchNsId,
    searchHtType,
    searchHtStatus,
    searchHtCardType,
    searchHtDatetimeMinMoment,
    searchHtDatetimeMaxMoment
  } = formValues || {}

  if (isNotEmptyArray(searchNbId)) {
    whereIn({ qb, column: '_lo.nbId', values: searchNbId })
  }

  if (isNotEmptyArray(searchNsId)) {
    whereIn({ qb, column: '_ht.nsId', values: searchNsId })
  }

  if (isNotEmptyArray(searchHtType)) {
    whereIn({ qb, column: '_ht.htType', values: searchHtType })
  }

  if (isNotEmptyArray(searchHtStatus)) {
    whereIn({ qb, column: '_ht.htStatus', values: searchHtStatus })
  }

  if (isNotEmptyArray(searchHtCardType)) {
    whereIn({ qb, column: '_ht.htCardType', values: searchHtCardType })
  }

  if (isNotEmptyString(searchHtDatetimeMinMoment)) {
    const m = moment(searchHtDatetimeMinMoment)
    if (m.isValid()) {
      qb.where('_ht.htDatetime', '>=', m.format(MYSQL_DT))
    }
  }

  if (isNotEmptyString(searchHtDatetimeMaxMoment)) {
    const m = moment(searchHtDatetimeMaxMoment)
    if (m.isValid()) {
      qb.where('_ht.htDatetime', '<=', m.format(MYSQL_DT))
    }
  }

  return qb
}

const qbFList = ({ filtered, bCsv, bLoads }) => ({
  qFList: qbF({ filtered, bCsv, bLoads }).select(selectColumns(bLoads ? aliasColumnsLoads : aliasColumns))
})

const qbFCount = ({ filtered, bCsv, bLoads }) => qbF(({ filtered, bCsv, bLoads })).count({ filteredCount: '*' }).first()

const qbFO = ({ filtered, ordered, bCsv, bLoads }) => qbF({ filtered, bCsv, bLoads }).orderBy(ordered)

const qbFOP = ({ filtered, ordered, page, perPage, filteredCount, bCsv, bLoads }) => {
  const normalizedPagination = normalizePagination({ page, perPage, filteredCount })
  const qFOP = qbFO({ filtered, ordered, bCsv, bLoads })
    .offset(normalizedPagination.normalizedOffset)
    .limit(normalizedPagination.normalizedLimit)
  return { qFOP, normalizedPagination }
}

const qbFOPList = ({ filtered, ordered, page, perPage, filteredCount, bCsv, bLoads }) => {
  const { qFOP, normalizedPagination } = qbFOP({ filtered, ordered, page, perPage, filteredCount, bCsv, bLoads })
  return { qFOPList: qFOP.select(selectColumns(bLoads ? aliasColumnsLoads : aliasColumns)), normalizedPagination }
}

const qbFOCsv = ({ filtered, ordered, bLoads }) => qbFO({ filtered, ordered, bCsv: true, bLoads })
  .select(bLoads ? csvHeaderLoads : csvHeader)

module.exports = { qbFList, qbFCount, qbFOPList, qbFOCsv, csvHeaderDisplay, csvHeaderDisplayLoads }
