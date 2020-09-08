
new window.Vue({ // eslint-disable-line no-new
  el: '#app',
  data: {
    uuid: '',
    account: 'Anonymous',
    socket: null,
    bRadio: true,
    radio: {
      currentTitleDisplay: ''
    },
    perso: {
      currentTitleDisplay: ''
    },
    flux: {
      mediaList: []
    },
    player: {
      currentMedia: {}
    },
    online: {
      userList: [],
      uuidToAccount: {}
    },
    share: {
      urlList: [],
      url: ''
    }
  },
  methods: {
    sendUrl: function () {
      const { url, urlList } = this.share

      const urlText = `${url || ''}`.trim()

      if (urlText && urlList.every(entry => entry.urlText !== urlText)) {
        this.share.url = ''
        const item = { urlText, senderUuid: this.uuid }
        this.socket.emit('SUBMIT_URL', item)
      }
    },

    play: function (item) {
      this.player.currentMedia = item
    }
  },
  created: async function () {
    const accountNameGiven = await window.Swal.fire({
      title: 'Username',
      input: 'text',
      inputAutoTrim: true,
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      confirmButtonText: 'OK',
      showCancelButton: true,
      cancelButtonText: this.account
    })

    this.account = (accountNameGiven && accountNameGiven.value) || this.account

    this.socket = window.io()

    this.socket.on(
      'USERS_LIST_UPDATED',
      ({ userList }) => {
        this.online.userList = userList
        this.online.uuidToAccount = userList.reduce((o, { uuid, account }) => ({ ...o, [uuid]: account }), {})
      }
    )

    this.socket.on(
      'NEW_SUBMISSION_PROCESSED',
      ({ urlText, isoTime, senderUuid, msTimestamp }) => {
        const senderAccount = this.online.uuidToAccount[senderUuid]
        const item = { urlText, isoTime, senderUuid, msTimestamp, senderAccount }
        if (this.share.urlList.every(entry => entry.urlText !== urlText)) {
          const freshUrlList = this.share.urlList.slice()

          freshUrlList.push(item)

          freshUrlList.sort((a, b) => (
            (b.msTimestamp - a.msTimestamp) ||
            ((a.senderUuid < b.senderUuid) ? -1 : +(b.senderUuid < a.senderUuid))
          ))

          if (freshUrlList.length > 10000) {
            freshUrlList.pop()
          }

          this.share.urlList = freshUrlList
        }
      }
    )

    this.socket.on(
      'PLAYLIST_UPDATED',
      ({ playlist }) => {
        console.log({ playlist })
        this.flux.mediaList = playlist.map(m => {
          const senderAccount = this.online.uuidToAccount[m.senderUuid]
          return { ...m, senderAccount }
        })
      }
    )

    this.socket.emit('MENSOORE', { account: this.account })
  },
  destroyed: function () {

  }
})
