'use strict'

const { SERVER_LISTEN_PORT, SERVER_LISTEN_ORIGIN } = require('./utils/env')

const { v4: uuidv4 } = require('uuid')

const app = require('./app')
const fastify = require('fastify')(app.options)

const SocketIOServer = require('socket.io')

const { isNotEmptyArray } = require('./utils/is-not-empty-array')
const { isSet } = require('./utils/is-set')

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

const sqlite3 = require('sqlite3')

const runAsync = function (db, sql) {
  return new Promise(function (resolve, reject) {
    try { db.run(sql) } catch (error) { reject(error) }
    resolve()
  })
}

const allAsync = function (db, sql) {
  return new Promise(function (resolve, reject) {
    db.all(
      sql,
      function (error, rows) {
        if (error) {
          reject(error)
        } else {
          resolve({ rows: rows })
        }
      }
    )
  })
}

const stmtRunAsync = function (stmt) {
  return new Promise(function (resolve, reject) {
    try { stmt.run() } catch (error) { reject(error) }
    resolve()
  })
}

const stmtAllAsync = function (stmt) {
  return new Promise(function (resolve, reject) {
    stmt.all(
      function (error, rows) {
        if (error) {
          reject(error)
        } else {
          resolve({ rows: rows })
        }
      }
    )
  })
}

const io = new SocketIOServer(fastify.server, {})

io.on(
  'connection',
  async socket => {
    let userUuid = ''

    const db = new sqlite3.Database(
      './sqlite_test_001.db',
      err => {
        if (err) {
          console.log({ message: 'Could not connect to the sqlite db', err })
        } else {
          console.log({ message: 'Connected to the sqlite db' })
        }
      }
    )

    const qCreateTableUser = `
      CREATE TABLE IF NOT EXISTS user (
        uuid TEXT PRIMARY KEY,
        account TEXT,
        bOnline INTEGER
      )
    `
    const qCreateTableMedia = `
      CREATE TABLE IF NOT EXISTS media (
        uuid TEXT PRIMARY KEY,
        id TEXT,
        urlText TEXT,
        senderUuid TEXT,
        isoTime TEXT,
        msTimestamp TEXT,
        type TEXT
      )
    `

    await Promise.all([runAsync(db, qCreateTableUser), runAsync(db, qCreateTableMedia)])

    socket.on(
      'MENSOORE',
      async ({ account }) => {
        const dNow = new Date()
        const uuid = uuidv4()
        const item = {
          uuid,
          urlText: `Welcome ${account}!`,
          senderUuid: '',
          isoTime: dNow.toISOString(),
          msTimestamp: +dNow
        }

        userUuid = uuid
        socket.emit('MENSOORE', { account, uuid })

        const stmt = db.prepare(
          'INSERT INTO user ( uuid, account, bOnline ) VALUES ( :uuid, :account, 1 )',
          { ':uuid': uuid, ':account': account }
        )
        await stmtRunAsync(stmt)

        let userList = []
        let playlist = []

        const [userListRes, playlistRes] = await Promise.all([
          allAsync(db, 'SELECT * FROM user'),
          allAsync(db, 'SELECT * FROM media')
        ])

        if (userListRes && isNotEmptyArray(userListRes.rows)) {
          userList = userListRes.rows
        }
        if (playlistRes && isNotEmptyArray(playlistRes.rows)) {
          playlist = playlistRes.rows
        }

        io.emit('NEW_SUBMISSION_PROCESSED', item)
        socket.emit('PLAYLIST_UPDATED', { playlist })
        io.emit('USERS_LIST_UPDATED', { userList })
      }
    )

    socket.on(
      'HAISAI',
      async ({ uuid, account }) => {
        const dNow = new Date()

        userUuid = uuid

        const stmtGetUser = db.prepare('SELECT * FROM user WHERE :uuid = uuid')
        await stmtAllAsync(stmtGetUser)
        const { rows: userRows } = (await allAsync(stmtGetUser)) || {}
        const userFound = userRows && userRows[0]

        const item = {
          uuid,
          urlText: `Welcome ${account}!`,
          senderUuid: '',
          isoTime: dNow.toISOString(),
          msTimestamp: +dNow
        }

        if (userFound) {
          await runAsync(db, 'UPDATE user SET bOnline = 1 WHERE :uuid = uuid')
        } else {
          const stmtNewUser = db.prepare(
            'INSERT INTO user ( uuid, account, bOnline ) VALUES ( :uuid, :account, 1 )',
            { ':uuid': uuid, ':account': isSet(account) ? account : `Anonymous_${+dNow}` }
          )
          await stmtRunAsync(stmtNewUser)
        }

        let userList = []
        let playlist = []

        const [userListRes, playlistRes] = await Promise.all([
          allAsync(db, 'SELECT * FROM user'),
          allAsync(db, 'SELECT * FROM media')
        ])

        if (userListRes && isNotEmptyArray(userListRes.rows)) {
          userList = userListRes.rows
        }
        if (playlistRes && isNotEmptyArray(playlistRes.rows)) {
          playlist = playlistRes.rows
        }

        io.emit('NEW_SUBMISSION_PROCESSED', item)
        socket.emit('PLAYLIST_UPDATED', { playlist, playlistRes: JSON.stringify(playlistRes) })
        io.emit('USERS_LIST_UPDATED', { userList, userListRes: JSON.stringify(userListRes) })
      }
    )

    socket.on(
      'SUBMIT_URL',
      async ({ urlText, senderUuid }) => {
        const dNow = new Date()
        const item = { urlText, isoTime: dNow.toISOString(), senderUuid, msTimestamp: +dNow }

        io.emit('NEW_SUBMISSION_PROCESSED', item)

        const url = urlText.trim()
        const bYoutuBe = url.includes('youtu.be')
        const bYoutube = url.includes('youtube')
        const bSpotify = url.includes('spotify:track:')
        const bSpotifyUrl = url.includes('spotify.com/track/')

        const getIdStrategies = [
          {
            if: bYoutuBe,
            getId: () => {
              let res = ''
              const grab = url.split('youtu.be/')
              if (grab[1]) {
                res = grab[1].trim().split('?')[0].trim()
              }
              return res
            }
          },
          {
            if: bYoutube,
            getId: () => {
              let res = ''
              const grabUrl = /[?&]v=([^&/\s]+)/.exec(url)
              if (grabUrl[1]) {
                res = grabUrl[1].trim()
              }
              return res
            }
          },
          { if: bSpotify, getId: () => url.split(':')[2].trim() },
          {
            if: bSpotifyUrl,
            getId: () => {
              let res = ''
              const grab = url.split('spotify.com/track/')
              if (grab[1]) {
                res = grab[1].trim().split('?')[0].trim()
              }
              return res
            }
          }
        ]
        const strategy = getIdStrategies.find(s => s.if)

        if (strategy) {
          const getId = strategy.getId

          const id = getId(url)

          const media = { id, type: '', senderUuid, isoTime: dNow.toISOString(), msTimestamp: +dNow }

          if (bYoutuBe || bYoutube) {
            media.type = 'youtube'
          }
          if (bSpotify || bSpotifyUrl) {
            media.type = 'spotify'
          }

          let currentPlaylist = []
          const cPlaylistRes = await allAsync(db, 'SELECT * FROM media')
          if (cPlaylistRes && isNotEmptyArray(cPlaylistRes.rows)) {
            currentPlaylist = cPlaylistRes.rows
          }
          if (currentPlaylist.every(m => (m.id !== media.id) || (m.type !== media.type))) {
            const kvcEntries = Object.entries(media).map(([k, v]) => ({ key: `:${k}`, value: v, column: k }))
            const kvParams = kvcEntries.reduce((o, { key, value }) => ({ ...o, [key]: value }), {})
            const stmt = db.prepare(
              `INSERT INTO media ( ${kvcEntries.map(e => e.column).join(',')} ) VALUES ( ${kvcEntries.map(e => e.key).join(',')} )`,
              kvParams
            )
            await stmtRunAsync(stmt)

            let playlist = []
            const playlistRes = await allAsync(db, 'SELECT * FROM media')
            if (playlistRes && isNotEmptyArray(playlistRes.rows)) {
              playlist = playlistRes.rows
            }

            io.emit('PLAYLIST_UPDATED', { playlist })
          }
        }
      }
    )

    socket.on(
      'disconnect',
      async () => {
        if (userUuid) {
          const stmtMedia = db.prepare('SELECT uuid FROM media WHERE :senderUuid = senderUuid LIMIT 1', { ':senderUuid': userUuid })
          const { rows: countMediaRes } = await stmtAllAsync(stmtMedia)
          if (countMediaRes.length) {
            await stmtRunAsync(db.prepare('UPDATE user SET bOnline = 0 WHERE :uuid = uuid', { ':uuid': userUuid }))
          } else {
            await stmtRunAsync(db.prepare('DELETE FROM user WHERE :uuid = uuid', { ':uuid': userUuid }))
          }
        }

        const resOnlineUsersList = await allAsync(db, 'SELECT * FROM user WHERE 0 < bOnline')
        const { rows: userList } = resOnlineUsersList || {}
        io.emit('USERS_LIST_UPDATED', { userList })
      }
    )
  }
)
