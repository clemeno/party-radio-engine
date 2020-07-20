'use strict'

module.exports = { whereIn: ({ qb, column, values }) => qb.where(_qb => values.forEach(v => _qb.orWhere({ [column]: v }))) }
