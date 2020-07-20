'use strict'

module.exports = { whereNotIn: ({ qb, column, values }) => values.reduce((_qb, v) => _qb.where(column, '!=', v), qb) }
