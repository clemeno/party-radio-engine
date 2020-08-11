'use strict'

const { SERVER_LISTEN_PORT, SERVER_LISTEN_ORIGIN } = require('./utils/env')

const app = require('./app')
const fastify = require('fastify')(app.options)

const SocketIOServer = require('socket.io')

process.on('unhandledRejection', err => {
  console.log(err)
  fastify.log.error(err)
})

fastify.register(app)

fastify.listen(
  SERVER_LISTEN_PORT || 43210,
  SERVER_LISTEN_ORIGIN || '::',
  err => {
    if (err) {
      console.log(err)
      fastify.log.error(err)
      process.exit(1)
    }
  }
)

const io = new SocketIOServer(fastify.server, {})

const userList = []
const submittedList = []
const playlist = []

io.on(
  'connection',
  socket => {
    let user = ''

    socket.on(
      'HAISAI',
      ({ uuid, account }) => {
        const dNow = new Date()
        const item = { urlText: `Welcome ${account}!`, isoTime: dNow.toISOString(), senderUuid: 'server', msTimestamp: +dNow }
        io.emit('NEW_SUBMISSION_PROCESSED', item)
        socket.emit('PLAYLIST_UPDATED', { playlist })
        user = uuid
        userList.push({ uuid, account })
        io.emit('USERS_LIST_UPDATED', { userList })
      }
    )

    socket.on(
      'SUBMIT_URL',
      ({ urlText, isoTime, senderUuid, msTimestamp }) => {
        const dNow = new Date()
        const item = { urlText, isoTime: dNow.toISOString(), senderUuid, msTimestamp: +dNow }
        if (submittedList.every(entry => entry.urlText !== urlText)) {
          io.emit('NEW_SUBMISSION_PROCESSED', item)

          const url = urlText.trim()
          const bYoutuBe = url.includes('youtu.be')
          const bYoutube = url.includes('youtube')

          const getIdStrategies = [
            { if: bYoutuBe, getId: () => `${url.split('youtu.be/')[1]}`.split('?')[0].trim() },
            { if: bYoutube, getId: () => `${/[?&]v=([^&]+)/.exec(url)[1]}`.trim() }
          ]
          const getId = getIdStrategies.find(s => s.if).getId

          if (getId) {
            const id = getId(url)

            const media = { id, senderUuid, isoTime: dNow.toISOString(), msTimestamp: +dNow, type: null }

            if (bYoutuBe || bYoutube) {
              media.type = 'youtube'
            }

            if (playlist.every(m => m.id !== id)) {
              playlist.push(media)
              io.emit('PLAYLIST_UPDATED', { playlist })
            }
          }
        }
      }
    )

    socket.on(
      'disconnect',
      () => {
        userList.splice(userList.indexOf(user), 1)
        io.emit('USERS_LIST_UPDATED', { userList })
      }
    )
  }
)
