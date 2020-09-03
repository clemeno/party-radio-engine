'use strict'

const { SERVER_LISTEN_PORT, SERVER_LISTEN_ORIGIN } = require( './utils/env' )

const { v4: uuidv4 } = require( 'uuid' )

const app = require( './app' )
const fastify = require( 'fastify' )( app.options )

const SocketIOServer = require( 'socket.io' )

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
  socket => {

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

    db.runAsync = function( sql, ...params ) {
      const self = this
      return new Promise( function( resolve, reject ) {
        try { self.run( sql, ...params ) } catch ( error ) { reject( error ) }
        resolve()
      } )
    }

    db.allAsync = function( sql, ...params ) {
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

    db.run( `
      CREATE TABLE IF NOT EXISTS users (
        uuid TEXT PRIMARY KEY,
        account TEXT
      )
    ` )

    db.run( `
      CREATE TABLE IF NOT EXISTS playlist (
        uuid TEXT PRIMARY KEY,
        senderUuid TEXT,
        isoTime TEXT,
        msTimestamp TEXT,
        type TEXT
      )
    ` )

    socket.on(
      'MENSOORE',
      ( { account } ) => {
        const dNow = new Date()
        const item = {
          urlText: `Welcome ${account}!`,
          isoTime: dNow.toISOString(),
          senderUuid: 'server',
          msTimestamp: +dNow,
          uuid: uuidv4()
        }

        let playlist = []
        let userList = []


        io.emit( 'NEW_SUBMISSION_PROCESSED', item )

        socket.emit( 'PLAYLIST_UPDATED', { playlist } )
        user = uuid
        userList.push( { uuid, account } )
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

          const media = { id, senderUuid, isoTime: dNow.toISOString(), msTimestamp: +dNow, type: null }

          if ( bYoutuBe || bYoutube ) {
            media.type = 'youtube'
          }
          if ( bSpotify || bSpotifyUrl ) {
            media.type = 'spotify'
          }

          if ( playlist.every( m => m.id !== id ) ) {
            playlist.push( media )
            io.emit( 'PLAYLIST_UPDATED', { playlist } )
          }
        }

      }
    )

    socket.on(
      'disconnect',
      () => {




        io.emit( 'USERS_LIST_UPDATED', { userList } )
      }
    )
  }
)
