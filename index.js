const Plugin = require('powercord/Plugin')
const { inject, uninject } = require('powercord/injector')
const { getOwnerInstance, sleep } = require('powercord/util')
const { getModule } = require('powercord/webpack')

module.exports = class DataAttributes extends Plugin {
  constructor () {
    super()

    this.getGuild = () => void 0
    this.getMembers = () => void 0
    this.getChannel = () => void 0
    this.initialized = false

    this.Modules = {
      Guild: {
        selector: '.container-2td-dC',
        instance: (elem) => getOwnerInstance(elem),
        patch: (_, res) => {
          if (!res._owner.memoizedProps) return res

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
        selector: '.content-OzHfo4',
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
          const channel = res.props.children[2] ? res.props.children[2].props.channel : res.props.children[3].props.children[1].props.channel
          if (!channel) return res

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
          res.props['data-user-id'] = author.id
          if (bot || author.bot) res.props.className += ' pca-isBot'
          if (attachments && attachments.length) res.props.className += ' pca-hasAttachments'
          if (embeds && embeds.length) res.props.className += ' pca-hasEmbeds'
          if (author && author.email) res.props.className += ' pca-isCurrentUser'
    
          if (channel.guild_id) {
            const guild = this.getGuild(channel.guild_id)
            const members = this.getMembers(channel.guild_id)
    
            if (author.id === guild.ownerId) res.props.className += ' pca-isGuildOwner'
            if (members.find(m => m.userId === author.id)) res.props.className += ' pca-isGuildMember'
          }
    
          return res
        }
      },
    }
  }

  async start () {
    this.getGuild = await getModule(m => m.getGuild).getGuild
    this.getMembers = await getModule(m => m.getMember).getMembers
    this.getChannel = await getModule(m => m.getChannels).getChannel
    this.initialized = true

    Object.keys(this.Modules).forEach((modName) => {
      const mod = this.Modules[modName]
    
      this.waitFor(mod.selector)
        .then((elem) => mod.instance(elem))
        .then((instance) => {
          console.log('[data attributes]', `patching ${modName}`)
          inject(`pc-dataattributes-${modName}`, Object.getPrototypeOf(instance), 'render', mod.patch)
          mod.patched = true
        })
    })
  }

  unload () {
    Object.keys(this.Modules).forEach(async (modName) => {
      const mod = this.Modules[modName]

      while (!mod.patched) await sleep(250)
      
      console.log('[data attributes]', `unpatching ${modName}`)
      uninject(`pc-dataattributes-${modName}`)

      mod.patched = false
    })
  }

  // Higher sleep time, don't really want to cause bottlenecks :sweat_drops:
  async waitFor (query) {
    let elem

    while (!(elem = document.querySelector(query))) {
      await sleep(2500)
    }
  
    return elem
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