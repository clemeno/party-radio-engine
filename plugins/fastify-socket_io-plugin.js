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
      let user = ''
      const userList = []
      const submittedList = []

      socket.on('HAJIMEMASHITE', ({ uuid }) => {
        const dNow = new Date()
        const item = { urlText: 'Welcome!', isoTime: dNow.toISOString(), senderUuid: 'server', msTimestamp: +dNow }
        socket.emit('NEW_SUBMISSION_PROCESSED', item)
        user = uuid
        userList.push(uuid)
        io.emit('USERS_LIST_UPDATED', { userList })
      })

      socket.on('SUBMIT_URL', ({ urlText, isoTime, senderUuid, msTimestamp }) => {
        const dNow = new Date()
        const item = { urlText, isoTime: dNow.toISOString(), senderUuid, msTimestamp: +dNow }
        if (submittedList.every(entry => entry.urlText !== urlText)) {
          io.emit('NEW_SUBMISSION_PROCESSED', item)
        }
      })

      socket.on('disconnect', () => {
        userList.splice(userList.indexOf(user), 1)
        io.emit('USERS_LIST_UPDATED', { userList })
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
