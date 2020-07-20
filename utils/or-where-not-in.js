'use strict'

module.exports = { orWhereNotIn: ({ qb, column, values }) => qb.orWhere(_qb => values.forEach(v => _qb.where(column, '!=', v))) }
