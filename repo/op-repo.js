'use strict'

const { normalizePagination, selectColumns, likeKeepPercentAndDash } = require('../utils/query-tools')

const { isNotEmptyString } = require('../utils/is-not-empty-string')
const { isNumeric } = require('../utils/is-numeric')

const { Op } = require('../model/op')
const { Od } = require('../model/od')

const _op = Op._as
const _od = Od._as

const _opColumns = ['*']

const aliasColumns = {
  [_op]: _opColumns
}

const qbOp = () => Op.query().alias(_op)

const qbIJoinOd = qb => qb.innerJoin({ [_od]: Od.tableName }, `${_op}.${Op.idColumn}`, `${_od}.${Op.idColumn}`)
// const qbOpLJoinOd = () => qbOp().leftJoin( { [ _od ]: Od.tableName }, `${_op}.${Op.idColumn}`, `${_od}.${Op.idColumn}` )

const qbF = ({ filtered }) => {
  const qb = qbOp()

  const { formValues, latestOfVer } = filtered || {}

  if (isNumeric(latestOfVer)) {
    qbIJoinOd(qb)
    qb.where({ '_od.ofVerOffer': latestOfVer })
  }

  const {
    searchOpCode,
    searchOpName
  } = formValues || {}

  if (isNotEmptyString(searchOpCode)) {
    qb.where('_op.opCode', 'like', `%${likeKeepPercentAndDash({ from: searchOpCode })}%`)
  }

  if (isNotEmptyString(searchOpName)) {
    qb.where('_op.opName', 'like', `%${likeKeepPercentAndDash({ from: searchOpName })}%`)
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
