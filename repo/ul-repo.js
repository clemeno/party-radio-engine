'use strict'

const { normalizePagination, selectColumns, likeKeepPercentAndDash } = require('../utils/query-tools')

const { isNotEmptyString } = require('../utils/is-not-empty-string')
const { isNotEmptyArray } = require('../utils/is-not-empty-array')

const { whereIn } = require('../utils/where-in')

const { Ul } = require('../model/ul')
const { User } = require('../model/user')
// const {Lo} = require('../model/lo')
// const {Eq} = require('../model/eq')
// const {Es} = require('../model/es')

const _ul = Ul._as
const _user = User._as
// const _lo = Lo._as
// const _eq = Eq._as
// const _es = Es._as

const _ulColumns = [
  'ul_id',
  'usId',
  // 'lo_id',
  // 'eq_id',
  'ul_creation_date',
  'ul_code',
  'ul_details'
]
const _userColumns = User.publishColumnsWithoutIdPassword
// const _loColumns = ['nl_id', 'ns_id', 'lo_identifier']
// const _eqColumns = ['et_id', 'eq_identifier']
// const _esColumns = ['es_serial']

const aliasColumns = {
  [_ul]: _ulColumns,
  [_user]: _userColumns
  // [ _lo ]: _loColumns,
  // [ _eq ]: _eqColumns,
  // [ _es ]: _esColumns
}

const qbUl = () => Ul.query().alias(_ul)

const qbUlLJoinUser = () => [_user].reduce((qb, to) => qb.leftJoinRelated(to), qbUl())

// const qbUlLJoinUserLoEq = () => [ _user, _lo, _eq ].reduce( ( qb, to ) => qb.leftJoinRelated( to ), qbUl() )
// const qbUlUserLoEqLJoinEs = () => qbUlLJoinUserLoEq().leftJoin( { [ _es ]: Es.tableName }, `${_es}.eq_id`, `${_eq}.${Eq._idKey}` )

const qbF = ({ filtered }) => {
  const qb = qbUlLJoinUser() // qbUlUserLoEqLJoinEs()

  const { formValues } = filtered
  const { searchAccount, searchAction } = formValues || {}

  if (isNotEmptyString(searchAccount)) {
    const patternLC = `%${likeKeepPercentAndDash({ from: searchAccount })}%`
    qb.where(_qb => _qb.where('usUsername', 'like', patternLC).orWhere('usEmail', 'like', patternLC)
    )
  }

  if (isNotEmptyArray(searchAction)) {
    whereIn({ qb, column: 'ul_code', values: searchAction })
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
