'use strict'

const rootController = async fastify => {
  const f = fastify

  let routing = []

  const getRouting = () => Array.from(f.routes).reduce(
    (routes, [i, route]) => ([
      ...routes,
      ...Object.entries(route).reduce((list, [type, { method, url: pattern }]) => [...list, { method, pattern }], [])
    ]),
    []
  )

  f.route({
    method: 'GET',
    url: '/',
    preHandler: async () => { routing = getRouting() },
    handler: async request => {
      // const [jwtError] = await fastify.to(request.jwtVerify())
      // const routes = jwtError ? routing.filter(r => ['', 'public_'].includes(`${r.pattern || ''}`.substr(1, 7))) : routing
      const routes = routing
      return { routes: routes.map(r => `${`[${r.method}]`.padEnd(9)}${r.pattern}`) }
    }
  })
}

module.exports = { rootController }
