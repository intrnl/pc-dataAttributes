# pc-dataAttributes

Powercord plugin that adds data attributes to various components

## Installation

Clone this repository on your Powercord install's plugins folder

```
git clone https://github.com/intrnl/pc-dataAttributes.git
```

## Explanation

Gives your theme a power up that would be impossible to achieve normally by adding special classes and attributes, could be useful for basic plugins as well, since you don't have to mess with Discord's internals to achieve such stuff.

Booleans and things that aren't usually unique are added as a class to that element, while things such as snowflakes and names are added as an attribute.

Here are the things that the plugin adds

- **Document body** _(yes, really)_
  - _attribute_ `data-channel-id`
  - _attribute_ `data-guild-id`
  - _class_ `pca-isDark`
  - _class_ `pca-isLight`
  - _class_ `pca-isUnfocused`
  - _class_ `pca-isHidden`
  - _class_ `pca-isMaximized`
  - _class_ `pca-isMinimized`
- **Guilds**
  - _attribute_ `data-guild-id`
  - _attribute_ `data-guild-name`
- **Guild channels and chat component**
  - _attribute_ `data-channel-id`
  - _attribute_ `data-channel-name`
  - _class_ `pca-isGuildChannel`
  - _class_ `pca-isPrivateChannel`
  - _class_ `pca-isGroupChannel`
  - _class_ `pca-isTextChannel`
- **Channel members**
  - _attribute_ `data-user-id`
  - _attribute_ `data-colorstring`
  - _class_ `pca-isCurrentUser`
  - _class_ `pca-isGuildOwner`
- **Message group**
  - _attribute_ `data-author-id`
  - _class_ `pca-isCurrentUser`
  - _class_ `pca-isSystemMessage`
  - _class_ `pca-isGuildOwner`
  - _class_ `pca-isGuildMember`
- **Message content**
  - _attribute_ `data-message-id`
  - _attribute_ `data-colorstring`
  - _attribute_ `data-author-id`
  - _class_ `pca-isBot`
  - _class_ `pca-isCurrentUser`
  - _class_ `pca-hasAttachments`
  - _class_ `pca-hasEmbeds`
  - _class_ `pca-isGuildOwner`
  - _class_ `pca-isGuildMember`
- **User popout role**
  - _attribute_ `data-role-id`
  - _attribute_ `data-role-name`
  - _attribute_ `data-role-color`
  - _class_ `pca-isHoisted`
  - _class_ `pca-isMentionable`
