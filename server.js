'use strict'

const { SERVER_LISTEN_PORT, SERVER_LISTEN_ORIGIN } = require( './utils/env' )

const { v4: uuidv4 } = require( 'uuid' )

const app = require( './app' )
const fastify = require( 'fastify' )( app.options )

const SocketIOServer = require( 'socket.io' )

const { isNotEmptyArray } = require( './utils/is-not-empty-array' )

process.on( 'unhandledRejection', err => {
  console.log( err )
  fastify.log.error( err )
} )

fastify.register( app )

fastify.listen(
  SERVER_LISTEN_PORT || 43210,
  SERVER_LISTEN_ORIGIN || '::',
  err => {
    if ( err ) {
      console.log( err )
      fastify.log.error( err )
      process.exit( 1 )
    }
  }
)

const sqlite3 = require( 'sqlite3' )

const io = new SocketIOServer( fastify.server, {} )

io.on(
  'connection',
  async socket => {

    let userUuid = ''

    const db = new sqlite3.Database(
      './sqlite_test_001.db',
      err => {
        if ( err ) {
          console.log( { message: 'Could not connect to the sqlite db', err } )
        } else {
          console.log( { message: 'Connected to the sqlite db' } )
        }
      }
    )

    const runAsync = function( sql, ...params ) {
      const self = this
      return new Promise( function( resolve, reject ) {
        try { self.run( sql, ...params ) } catch ( error ) { reject( error ) }
        resolve()
      } )
    }

    const allAsync = function( sql, ...params ) {
      const self = this
      return new Promise( function( resolve, reject ) {
        self.all(
          sql,
          ...params,
          function( error, rows ) {
            if ( error ) {
              reject( error )
            } else {
              resolve( { rows: rows } )
            }
          }
        )
      } )
    }

    const stmtRunAsync = function( ...params ) {
      const self = this
      return new Promise( function( resolve, reject ) {
        try { self.run( ...params ) } catch ( error ) { reject( error ) }
        resolve()
      } )
    }

    db.runAsync = runAsync
    db.allAsync = allAsync

    const qCreateTableUser = `
      CREATE TABLE IF NOT EXISTS user (
        uuid TEXT PRIMARY KEY,
        account TEXT
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

    await Promise.all( [ db.runAsync( qCreateTableUser ), db.runAsync( qCreateTableMedia ) ] )

    socket.on(
      'MENSOORE',
      ( { account } ) => {
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

        const stmt = db.prepare( `INSERT INTO user ( uuid, account ) VALUES ( :uuid, :account )`, { ':uuid': uuid, ':account': account } )
        stmt.runAsync = stmtRunAsync
        await stmt.runAsync()

        let userList = []
        let playlist = []

        const [ userListRes, playlistRes ] = await Promise.all( [
          qb.allAsync( `SELECT * FROM user` ),
          qb.allAsync( `SELECT * FROM media` )
        ] )

        if ( userListRes && isNotEmptyArray( userListRes.rows ) ) {
          userList = userListRes.rows
        }
        if ( playlistRes && isNotEmptyArray( playlistRes.rows ) ) {
          playlist = playlistRes.rows
        }

        io.emit( 'NEW_SUBMISSION_PROCESSED', item )
        socket.emit( 'PLAYLIST_UPDATED', { playlist } )
        io.emit( 'USERS_LIST_UPDATED', { userList } )
      }
    )

    socket.on(
      'SUBMIT_URL',
      ( { urlText, isoTime, senderUuid, msTimestamp } ) => {
        const dNow = new Date()
        const item = { urlText, isoTime: dNow.toISOString(), senderUuid, msTimestamp: +dNow }

        io.emit( 'NEW_SUBMISSION_PROCESSED', item )

        const url = urlText.trim()
        const bYoutuBe = url.includes( 'youtu.be' )
        const bYoutube = url.includes( 'youtube' )
        const bSpotify = url.includes( 'spotify:track:' )
        const bSpotifyUrl = url.includes( 'spotify.com/track/' )

        const getIdStrategies = [
          {
            if: bYoutuBe,
            getId: () => {
              let res = ''
              const grab = url.split( 'youtu.be/' )
              if ( grab[ 1 ] ) {
                res = grab[ 1 ].trim().split( '?' )[ 0 ].trim()
              }
              return res
            }
          },
          {
            if: bYoutube,
            getId: () => {
              let res = ''
              const grabUrl = /[?&]v=([^&/\s]+)/.exec( url )
              if ( grabUrl[ 1 ] ) {
                res = grabUrl[ 1 ].trim()
              }
              return res
            }
          },
          { if: bSpotify, getId: () => url.split( ':' )[ 2 ].trim() },
          {
            if: bSpotifyUrl,
            getId: () => {
              let res = ''
              const grab = url.split( 'spotify.com/track/' )
              if ( grab[ 1 ] ) {
                res = grab[ 1 ].trim().split( '?' )[ 0 ].trim()
              }
              return res
            }
          }
        ]
        const strategy = getIdStrategies.find( s => s.if )

        if ( strategy ) {
          const getId = strategy.getId

          const id = getId( url )

          const media = { id, type: '', senderUuid, isoTime: dNow.toISOString(), msTimestamp: +dNow }

          if ( bYoutuBe || bYoutube ) {
            media.type = 'youtube'
          }
          if ( bSpotify || bSpotifyUrl ) {
            media.type = 'spotify'
          }

          let currentPlaylist = []
          const cPlaylistRes = qb.allAsync( `SELECT * FROM media` )
          if ( cPlaylistRes && isNotEmptyArray( cPlaylistRes.rows ) ) {
            currentPlaylist = cPlaylistRes.rows
          }
          if ( currentPlaylist.every( m => ( m.id !== media.id ) || ( m.type !== media.type ) ) ) {
            const kvcEntries = Object.entries( media ).map( ( [ k, v ] ) => ( { key: `:${k}`, value: v, column: k } ) )
            const kvParams = kvcEntries.reduce( ( o, { key, value } ) => ( { ...o, [ key ]: value } ), {} )
            const stmt = db.prepare(
              `INSERT INTO media ( ${entries.map( e => e.column ).join( ',' )} ) VALUES ( ${entries.map( e => e.key ).join( ',' )} )`,
              kvParams
            )
            stmt.runAsync = stmtRunAsync
            await stmt.runAsync()

            let playlist = []
            const playlistRes = qb.allAsync( `SELECT * FROM media` )
            if ( playlistRes && isNotEmptyArray( playlistRes.rows ) ) {
              playlist = playlistRes.rows
            }

            io.emit( 'PLAYLIST_UPDATED', { playlist } )
          }
        }

      }
    )

    socket.on(
      'disconnect',
      () => {

        // qb.run( `DELETE FROM user WHERE` )

        let userList = []

        io.emit( 'USERS_LIST_UPDATED', { userList } )
      }
    )
  }
)
