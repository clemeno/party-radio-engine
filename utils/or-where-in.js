'use strict'

module.exports = { orWhereIn: ({ qb, column, values }) => values.reduce((_qb, v) => _qb.orWhere({ [column]: v }), qb) }
