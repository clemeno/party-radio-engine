// see Support for Socket.io ? https://github.com/fastify/fastify/issues/242

const fastifyPlugin = require('fastify-plugin')
const SocketIOServer = require('socket.io')

/**
 * Create a new Socket.io server and decorate Fastify with its instance.
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Plugin's options that will be sent to Socket.io contructor
 * @param {Function} next - Fastify next callback
 */
function fastiySocketIo (fastify, options, next) {
  try {
    //   can also be called without using the new keyword, internal implementation
    // looks like   if (!(this instanceof Server)) return new Server(srv, opts);
    // first argument takes the server being used, could be http server express server or anything
    // options are the options for fastify server, so now we can simply change the option and that takes
    // affect everywhere
    const io = new SocketIOServer(fastify.server, options)

    io.on('connection', socket => {
      socket.on('disconnect', () => {
      })
    })

    // use io wherever you want to use socketio, just provide it in the registration context
    fastify.decorate('io', io)

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = fastifyPlugin(fastiySocketIo, { name: 'fastify-socket.io' })
