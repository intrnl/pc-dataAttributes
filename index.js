const Plugin = require('powercord/Plugin')
const { inject, uninject } = require('powercord/injector')
const { getOwnerInstance, sleep } = require('powercord/util')
const { getModule } = require('powercord/webpack')

module.exports = class DataAttributes extends Plugin {
  constructor () {
    super()

    this.Modules = {
      DMChannel: {
        selector: '.channel-2QD9_O[style]',
        instance: (elem) => getOwnerInstance(elem),
        patch: (_, res) => {
          // For some reason, we're also patching into random things,
          // Unsure why, but this is the bodge for now.
          if (!res.props.className) return res
          if (!res.props.className.includes('channel-2QD9_O')) return res

          let { channel, user } = res.props.children.props.children[0].props

          if (!channel) channel = this.getChannel(this.getDMChannelId(user.id))

          if (user) {
            res.props['data-user-id'] = user.id
            if (user.bot) res.props.className += ' pca-isBot'
          }

          return this._channelHandler(channel, res)
        }
      },
      Guild: {
        selector: '.container-2td-dC',
        instance: (elem) => getOwnerInstance(elem),
        patch: (_, res) => {
          if (!res._owner && !res._owner.memoizedProps) return res

          const { guild } = res._owner.memoizedProps
          if (!guild) return res

          res.props['data-guild-id'] = guild.id
          res.props['data-guild-name'] = guild.name

          return res
        }
      },
      GuildTextChannel: {
        selector: '.wrapperConnectedText-3NUF2g, .wrapperDefaultText-2IWcE8, .wrapperHoveredText-2geN_M, .wrapperLockedText-wfOnM5, .wrapperMutedText-1YBpvv, .wrapperSelectedText-3dSUjC, .wrapperUnreadText-2zuiuD',
        instance: (elem) => getOwnerInstance(elem.parentElement),
        patch: (_, res) => {
          if (!res.props.children.props) return res

          const { channel } = res.props.children.props
          if (!channel) return res

          return this._channelHandler(channel, res)
        }
      },
      GuildVoiceChannel: {
        selector: '.wrapperConnectedVoice-2mvQJY, .wrapperDefaultVoice-1yvceo, .wrapperHoveredVoice-3ItgyI, .wrapperLockedVoice-3QrBs-, .wrapperMutedVoice-10gPcW, .wrapperSelectedVoice-xzxa2u, .wrapperUnreadVoice-23GIYe',
        instance: (elem) => getOwnerInstance(elem.parentElement),
        patch: (_, res) => {
          if (!res.props.children[0].props) return res

          const { channel } = res.props.children[0].props
          if (!channel) return res

          return this._channelHandler(channel, res)
        },
      },
      GuildStoreListingChannel: {
        selector: '.wrapper-KpKNwI .icon-sxakjD[name="StoreTag"]',
        instance: (elem) => getOwnerInstance(elem.parentElement.parentElement.parentElement.parentElement),
        patch: (_, res) => {
          if (!res.props.children.props) return res

          const { channel } = res.props.children.props
          if (!channel) return res

          return this._channelHandler(channel, res)
        }
      },
      ChannelMember: {
        selector: '.content-OzHfo4:not(.placeholder-oNR4zO)',
        instance: (elem) => getOwnerInstance(elem),
        patch: (_, res) => {
          if (!res._owner || !res._owner.memoizedProps) return res

          const { user, colorString, isOwner } = res._owner.memoizedProps

          res.props['data-user-id'] = user.id
          res.props['data-colorstring'] = colorString
          if (user.email) res.props.className += ' pca-isCurrentUser'
          if (isOwner) res.props.className += ' pca-isGuildOwner'

          return res
        }
      },
      Chat: {
        selector: '.chat-3bRxxu',
        instance: (elem) => getOwnerInstance(elem),
        patch: (_, res) => {
          const { channel, theme } = res.props.children[2] ? res.props.children[2].props : res.props.children[3].props.children[1].props
          if (!channel) return res

          // Add some stuff to body as well, just for fun.
          document.body.setAttribute('data-channel-id', channel.id)

          if (channel.guild_id) {
            document.body.setAttribute('data-guild-id', channel.guild_id)
          } else {
            document.body.removeAttribute('data-guild-id')
          }

          if (theme === 'dark') {
            document.body.classList.add('pca-isDark')
            document.body.classList.remove('pca-isLight')
          } else {
            document.body.classList.add('pca-isLight')
            document.body.classList.remove('pca-isDark')
          }

          return this._channelHandler(channel, res)
        }
      },
      MessageGroup: {
        selector: '.container-1YxwTf',
        instance: (elem) => getOwnerInstance(elem),
        patch: (_, res) => {
          if (!res.props.children[0][0].props) return res

          const { message } = res.props.children[0][0].props
          if (!message) return res

          const { author, type, channel_id } = message
          const channel = this.getChannel(channel_id)

          res.props['data-author-id'] = author.id
          if (author.email) res.props.className += ' pca-isCurrentUser'
          if (type !== 0) res.props.className += ' pca-isSystemMessage'

          if (channel.guild_id) {
            const guild = this.getGuild(channel.guild_id)
            const members = this.getMembers(channel.guild_id)

            if (author.id === guild.ownerId) res.props.className += ' pca-isGuildOwner'
            if (members.find(m => m.userId === author.id)) res.props.className += ' pca-isGuildMember'
          }

          return res
        }
      },
      MessageContent: {
        selector: '.message-1PNnaP',
        instance: (elem) => getOwnerInstance(elem),
        patch: (_, res) => {
          if (!res._owner.memoizedProps) return res

          const { message, channel } = res._owner.memoizedProps
          const { id, colorString, bot, author, attachments, embeds } = message

          res.props['data-message-id'] = id
          res.props['data-colorstring'] = colorString
          res.props['data-author-id'] = author.id
          if (author && author.email) res.props.className += ' pca-isCurrentUser'
          if (bot || author.bot) res.props.className += ' pca-isBot'
          if (attachments && attachments.length) res.props.className += ' pca-hasAttachments'
          if (embeds && embeds.length) res.props.className += ' pca-hasEmbeds'

          if (channel.guild_id) {
            const guild = this.getGuild(channel.guild_id)
            const members = this.getMembers(channel.guild_id)

            if (author.id === guild.ownerId) res.props.className += ' pca-isGuildOwner'
            if (members.find(m => m.userId === author.id)) res.props.className += ' pca-isGuildMember'
          }

          return res
        }
      },
      UserRole: {
        selector: '.role-2irmRk',
        instance: (elem) => getOwnerInstance(elem),
        patch: function (_, res) {
          const { role } = this.props
          if (!role) return res

          res.props['data-role-id'] = role.id
          res.props['data-role-name'] = role.name
          res.props['data-role-color'] = role.colorString
          if (role.hoist) res.props.className += ' pca-isHoisted'
          if (role.mentionable) res.props.className += ' pca-isMentionable'

          return res
        }
      }
    }

    this.WindowListeners = {
      'blur': () => document.body.classList.add('pca-isUnfocused'),
      'focus': () => document.body.classList.remove('pca-isUnfocused'),

      'hide': () => document.body.classList.add('pca-isHidden'),
      'show': () => document.body.classList.remove('pca-isHidden'),

      'maximize': () => document.body.classList.add('pca-isMaximized'),
      'unmaximize': () => document.body.classList.remove('pca-isMaximized'),

      'minimize': () => document.body.classList.add('pca-isMinimized'),
      'restore': () => document.body.classList.remove('pca-isMinimized'),
    }

    this.currentWindow = require('electron').remote.getCurrentWindow()
  }

  async start () {
    this.initialized = true

    this.getGuild = await getModule(m => m.getGuild).getGuild
    this.getMembers = await getModule(m => m.getMember).getMembers
    this.getChannel = await getModule(m => m.getChannels).getChannel
    this.getDMChannelId = await getModule(m => m.getChannels).getDMFromUserId

    Object.keys(this.Modules).forEach((modName) => {
      const mod = this.Modules[modName]

      this.waitFor(mod.selector)
        .then((elem) => mod.instance(elem))
        .then((instance) => {
          // Don't continue patching if:
          // - plugin is disabled
          // - it's already patched
          if (!this.initialized || mod.patched) return

          console.log('[data attributes]', `patching ${modName}`)
          inject(`pc-dataattributes-${modName}`, Object.getPrototypeOf(instance), 'render', mod.patch)

          this.forceUpdateAll(mod)
          mod.patched = true
        })
    })

    Object.keys(this.WindowListeners).forEach((eventName) => {
      const runFunction = this.WindowListeners[eventName]

      this.currentWindow.on(eventName, runFunction)
    })
  }

  unload () {
    this.initialized = false

    Object.keys(this.Modules).forEach(async (modName) => {
      const mod = this.Modules[modName]

      uninject(`pc-dataattributes-${modName}`)

      this.forceUpdateAll(mod)
      mod.patched = false
    })

    Object.keys(this.WindowListeners).forEach((eventName) => {
      const runFunction = this.WindowListeners[eventName]

      this.currentWindow.off(eventName, runFunction)
    })

    // Remove stuff from body
    document.body.classList.remove('pca-isDark', 'pca-isLight')
    document.body.classList.remove('pca-isUnfocused', 'pca-isHidden', 'pca-isMaximized', 'pca-isMinimized')
    document.body.removeAttribute('data-channel-id')
    document.body.removeAttribute('data-guild-id')
  }

  // Higher sleep time, don't really want to cause performance issues :sweat_drops:
  async waitFor (query) {
    let elem

    while (!(elem = document.querySelector(query))) {
      await sleep(2500)
    }

    return elem
  }

  forceUpdateAll (mod) {
    for (const elem of document.querySelectorAll(mod.selector)) {
      const inst = mod.instance(elem)
      inst.forceUpdate()
    }
  }

  _channelHandler (channel, res) {
    res.props['data-channel-id'] = channel.id
    res.props['data-channel-name'] = channel.name || null

    // Location
    if ([0, 2, 4, 6].includes(channel.type)) res.props.className += ' pca-isGuildChannel'
    if ([1, 3].includes(channel.type)) res.props.className += ' pca-isPrivateChannel'
    if ([3].includes(channel.type)) res.props.className += ' pca-isGroupChannel'

    // Type
    if (channel.type === 0) res.props.className += ' pca-isTextChannel'
    if (channel.type === 2) res.props.className += ' pca-isVoiceChannel'
    if (channel.type === 6) res.props.className += ' pca-isStoreListingChannel'

    return res
  }
}
