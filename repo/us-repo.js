'use strict'

const { normalizePagination, likeKeepPercentAndDash } = require('../utils/query-tools')

const { isNotEmptyString } = require('../utils/is-not-empty-string')

const { Us } = require('../model/us')

const qbUs = () => Us.query()

const qbF = ({ filtered }) => {
  const qb = qbUs()

  const { formValues } = filtered
  const { searchAccount } = formValues || {}

  if (isNotEmptyString(searchAccount)) {
    const pattern = `%${likeKeepPercentAndDash({ from: searchAccount })}%`
    qb.where(_qb => _qb.where('usUsername', 'like', pattern).orWhere('usEmail', 'like', pattern))
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
  return { qFOPList: qFOP.select(Us.publishColumnsWithoutPassword), normalizedPagination }
}

const qbFindUsById = usId => qbUs().findById(usId)

const qbPublishUsById = usId => qbFindUsById(usId).select(Us.publishColumnsWithoutPassword)

const qbPatchAndFetchUsById = ({ usId, patch }) => qbUs().patchAndFetchById(usId, patch)

const qbUsInsert = keyValues => qbUs().insert(keyValues)
const qbUsInsertGraph = graph => qbUs().insertGraph(graph)

const qbUsDeletebyId = usId => qbUs().deleteById(usId)

module.exports = {
  qbUs,

  qbFCount,

  qbFOPList,

  qbFindUsById,

  qbPublishUsById,

  qbPatchAndFetchUsById,

  qbUsInsert,
  qbUsInsertGraph,

  qbUsDeletebyId
}
