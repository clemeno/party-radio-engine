'use strict'

const { normalizePagination, selectColumns, likeKeepPercentAndDash, selectColumnsInOrder } = require('../utils/query-tools')

const { isNotEmptyArray } = require('../utils/is-not-empty-array')
const { isNotEmptyString } = require('../utils/is-not-empty-string')
const { whereIn } = require('../utils/where-in')

const moment = require('moment-timezone')
const { MYSQL_DT } = require('../utils/env')

const { Al } = require('../model/al')
const { At } = require('../model/at')
const { Lo } = require('../model/lo')
const { Eq } = require('../model/eq')
const { Es } = require('../model/es')
const { Eo } = require('../model/eo')
const { Ns } = require('../model/ns')
const { Nb } = require('../model/nb')

const _al = Al._as
const _at = At._as
const _lo = Lo._as
const _eq = Eq._as
const _es = Es._as
const _eo = Eo._as
const _ns = Ns._as
const _nb = Nb._as

const _alColumns = ['alId', 'nbId', 'nsId', 'eqId', 'alStatus', 'alDate', 'alResolved', 'alArchived', 'alDetails']
const _atColumns = ['atMinimumLevel', 'atResolutionMode']
const _loColumns = ['loName']
const _eqColumns = ['etId', 'eqIdentifier', 'eqMode']
const _esColumns = ['esSerial']
const _eoColumns = ['eoLogicalsn']

const aliasColumns = {
  [_al]: _alColumns,
  [_at]: _atColumns,
  [_lo]: _loColumns,
  [_eq]: _eqColumns,
  [_es]: _esColumns,
  [_eo]: _eoColumns
}

const _alCsvColumns = ['alStatus', 'alDate', 'alResolved', 'alArchived', 'alDetails']
const _atCsvColumns = ['atMinimumLevel']
const _loCsvColumns = ['loName']
const _eqCsvColumns = ['eqIdentifier', 'eqMode']
const _esCsvColumns = ['esSerial']
const _eoCsvColumns = ['eoLogicalsn']
const _nsCsvColumns = ['nsName']
const _nbCsvColumns = ['nbIdentifier']

const csvColumns = {
  [_al]: _alCsvColumns,
  [_at]: _atCsvColumns,
  [_lo]: _loCsvColumns,
  [_eq]: _eqCsvColumns,
  [_es]: _esCsvColumns,
  [_eo]: _eoCsvColumns,
  [_ns]: _nsCsvColumns,
  [_nb]: _nbCsvColumns
}

const csvColumnsOrder = [
  'alStatus',
  'nsName',
  'nbIdentifier',
  'loName',
  'eoLogicalsn',
  'eqIdentifier',
  'esSerial',
  'atMinimumLevel',
  'alDate',
  'alResolved',
  'alArchived',
  'alDetails'
]
const csvHeader = selectColumnsInOrder({ aliasColumns: csvColumns, order: csvColumnsOrder })

const csvHeaderDisplay = [
  'Status',
  'Station',
  'Bus',
  'Location',
  'Logical ID',
  'Physical ID',
  'SAM',
  'Level',
  'Date',
  'Resolved',
  'Archived',
  'Details'
]

const qbAl = () => Al.query().alias(_al)

// const qbAlLJoinAtEq = () => [_at, _eq].reduce((qb, to) => qb.leftJoinRelated(to), qbAl())
// const qbAlAtLoEqLJoinEs = () => qbAlLJoinAtEq().leftJoin({ [_es]: Es.tableName }, `${_es}.eqId`, `${_eq}.${Eq.idColumn}`)

const qbJoined = () => qbAl()
  .leftJoin({ [_at]: At.tableName }, `${_al}.${At.idColumn}`, At._idFull)
  .leftJoin({ [_eq]: Eq.tableName }, `${_al}.${Eq.idColumn}`, Eq._idFull)
  .leftJoin({ [_es]: Es.tableName }, `${_al}.${Eq.idColumn}`, `${_es}.${Eq.idColumn}`)
  .leftJoin({ [_eo]: Eo.tableName }, `${_al}.${Eq.idColumn}`, `${_eo}.${Eq.idColumn}`)
  .leftJoin({ [_lo]: Lo.tableName }, `${_al}.${Eq.idColumn}`, `${_lo}.${Eq.idColumn}`)

const qbJoinedCsv = () => qbJoined()
  .leftJoin({ [_ns]: Ns.tableName }, `${_al}.${Ns.idColumn}`, Ns._idFull)
  .leftJoin({ [_nb]: Nb.tableName }, `${_al}.${Nb.idColumn}`, Nb._idFull)

const qbF = ({ filtered, bCsv }) => {
  const qb = bCsv ? qbJoinedCsv() : qbJoined()

  const { formValues, alIdList, nsIdList, nbIdList, eqIdList } = filtered || {}

  if (isNotEmptyArray(alIdList)) {
    whereIn({ qb, column: '_al.alId', values: alIdList })
  }

  if (isNotEmptyArray(nsIdList)) {
    whereIn({ qb, column: '_al.nsId', values: nsIdList })
  }

  if (isNotEmptyArray(nbIdList)) {
    whereIn({ qb, column: '_al.nbId', values: nbIdList })
  }

  if (isNotEmptyArray(eqIdList)) {
    whereIn({ qb, column: '_al.eqId', values: eqIdList })
  }

  const {
    searchEqMode,
    searchAlStatus,
    searchAtMinimumLevel,
    searchNbId,
    searchNsId,
    searchLoName,
    searchEsSerial,
    searchEtId,
    searchEoLogicalsn,
    searchEqIdentifier,
    searchAlDateMinMoment,
    searchAlDateMaxMoment,
    searchVehicle,
    searchAtDescription,
    searchAlDetails
  } = formValues || {}

  if (isNotEmptyArray(searchVehicle)) {
    const bBus = searchVehicle.includes('bus')
    const bStation = searchVehicle.includes('station')
    if (bBus && !bStation) {
      qb.whereNotNull('_al.nbId')
    }
    if (!bBus && bStation) {
      qb.whereNotNull('_al.nsId')
    }
  }

  if (isNotEmptyArray(searchEqMode)) {
    whereIn({ qb, column: '_eq.eqMode', values: searchEqMode })
  }

  if (isNotEmptyArray(searchAlStatus)) {
    whereIn({ qb, column: '_al.alStatus', values: searchAlStatus })
  }

  if (isNotEmptyArray(searchAtMinimumLevel)) {
    whereIn({ qb, column: '_at.atMinimumLevel', values: searchAtMinimumLevel })
  }

  if (isNotEmptyArray(searchNbId)) {
    whereIn({ qb, column: '_al.nbId', values: searchNbId })
  }

  if (isNotEmptyArray(searchNsId)) {
    whereIn({ qb, column: '_al.nsId', values: searchNsId })
  }

  if (isNotEmptyString(searchLoName)) {
    qb.where('_lo.loName', 'like', `%${likeKeepPercentAndDash({ from: searchLoName })}%`)
  }

  if (isNotEmptyString(searchEsSerial)) {
    qb.where('_es.esSerial', `${+`0x${searchEsSerial}`}`)
  }

  if (isNotEmptyArray(searchEtId)) {
    whereIn({ qb, column: '_eq.etId', values: searchEtId })
  }

  if (isNotEmptyString(searchEoLogicalsn)) {
    qb.where('_eo.eoLogicalsn', 'like', `%${likeKeepPercentAndDash({ from: searchEoLogicalsn })}%`)
  }

  if (isNotEmptyString(searchEqIdentifier)) {
    qb.where('_eq.eqIdentifier', 'like', `%${likeKeepPercentAndDash({ from: searchEqIdentifier })}%`)
  }

  if (isNotEmptyString(searchAtDescription)) {
    qb.where('_at.atDescription', 'like', `%${likeKeepPercentAndDash({ from: searchAtDescription })}%`)
  }

  if (isNotEmptyString(searchAlDetails)) {
    qb.where('_al.alDetails', 'like', `%${likeKeepPercentAndDash({ from: searchAlDetails })}%`)
  }

  if (isNotEmptyString(searchAlDateMinMoment)) {
    qb.where('_al.alCreationDate', '>=', moment(searchAlDateMinMoment).format(MYSQL_DT))
  }

  if (isNotEmptyString(searchAlDateMaxMoment)) {
    qb.where('_al.alCreationDate', '<=', moment(searchAlDateMaxMoment).format(MYSQL_DT))
  }

  return qb
}

const qbFCount = ({ filtered, bCsv }) => qbF({ filtered, bCsv }).count({ filteredCount: '*' }).first()

const qbFO = ({ filtered, ordered, bCsv }) => qbF({ filtered, bCsv }).orderBy(ordered)

const qbFOP = ({ filtered, ordered, page, perPage, filteredCount }) => {
  const normalizedPagination = normalizePagination({ page, perPage, filteredCount })
  const qFOP = qbFO({ filtered, ordered }).offset(normalizedPagination.normalizedOffset).limit(normalizedPagination.normalizedLimit)
  return { qFOP, normalizedPagination }
}

const qbFOPList = ({ filtered, ordered, page, perPage, filteredCount }) => {
  const { qFOP, normalizedPagination } = qbFOP({ filtered, ordered, page, perPage, filteredCount })
  return { qFOPList: qFOP.select(selectColumns(aliasColumns)), normalizedPagination }
}

const qbFOCsv = ({ filtered, ordered }) => qbFO({ filtered, ordered, bCsv: true }).select(csvHeader)

// const qbFindAlById = id => qbAl().findById( id )

// const qbPatchAndFetchAlById = ( { id, patch } ) => qbAl().patchAndFetchById( id, patch )

// const qbAlInsert = keyValues => qbAl().insert( keyValues )
// const qbAlInsertGraph = graph => qbAl().insertGraph( graph )

// const qbAlDeletebyId = id => qbAl().deleteById( id )

const qbNsUnderAl = async () => qbAl()
  .innerJoin({ [_at]: At.tableName }, `${_al}.${At.idColumn}`, At._idFull)
  .whereNotNull('_al.nsId')
  .where('_al.alStatus', '<', 3)
  .where('_at.atMinimumLevel', '<', 3)
  .groupBy('_al.nsId')
  .min({ minLevel: '_at.atMinimumLevel' })
  .select({ nsId: '_al.nsId' })

const qbNbUnderAl = async () => qbAl()
  .innerJoin({ [_at]: At.tableName }, `${_al}.${At.idColumn}`, At._idFull)
  .whereNotNull('_al.nbId')
  .where('_al.alStatus', '<', 3)
  .where('_at.atMinimumLevel', '<', 3)
  .groupBy('_al.nbId')
  .min({ minLevel: '_at.atMinimumLevel' })
  .select({ nbId: '_al.nbId' })

const qbEqUnderAlCount = async q => {
  const qb = qbAl()
    .innerJoin({ [_at]: At.tableName }, `${_al}.${At.idColumn}`, At._idFull)
    .whereNotNull('_al.eqId')
    .where('_al.alStatus', '<', 3)
    .where('_at.atMinimumLevel', '<', 3)

  const { eqIdList } = q || {}
  if (isNotEmptyArray(eqIdList)) {
    whereIn({ qb, column: '_al.eqId', values: eqIdList })
  }

  return qb
    .groupBy('_al.eqId')
    .min('_at.atMinimumLevel', { as: 'minLevel' })
    .count({ activeAlCount: '_al.alId' })
    .select({ eqId: '_al.eqId' })
}

module.exports = { qbFCount, qbFOPList, qbNsUnderAl, qbNbUnderAl, qbEqUnderAlCount, qbFOCsv, csvHeaderDisplay }
