// const prettyJs = require('pretty-js')

class React {
  constructor (plugin) {
    this.plugin = plugin
    this.components = {}

    try {
      let unkown = 0
      const v = Date.now()
      webpackJsonp(
        [],
        {
          [v]: (self, _, load) => {
            const modules = load.c // get module array
            // this will load only available modules and won't execute new modules

            const keys = Object.keys(modules)
            this.plugin.debug('detected', keys.length, 'modules to scan!')
            keys.forEach(key => {
              let mod = modules[key].exports
              // check for babel style modules
              if (mod && mod.__esModule) mod = mod.default
              if (!mod || !mod.prototype || !mod.prototype.render) return
              // skip wrapper components
              if (mod.displayName && mod.displayName.includes('(')) return

              if (mod.displayName) {
                this.components[mod.displayName] = mod
              } else {
                let name = this.getName(
                  mod, unkown)
                if (name === undefined) {
                  this.plugin.debug(
                    unkown++,
                    'found unkown object that looks like a react component',
                    mod
                  )
                } else {
                  if (name === null) unkown++
                  else this.components[name] = mod
                }
              }
            })

            /*
                for (let i = 0; true; i++) {
                    let wpm = load(i)
                    // babel es modules
                    if (wpm.__esModule) wpm = wpm.default
                    // check for render method from react modules
                    if (!wpm || !wpm.prototype || !wpm.prototype.render) continue

                    if (!wpm.displayName) {
                        this.plugin.debug("Unkown component @", i, wpm.name, Object.keys(wpm), Object.keys(wpm.prototype), wpm.defaultProps, wpm)

                        continue
                    } else if (wpm.displayName.includes("(")) {
                        // ignore wrapper
                        continue
                    }

                    this.components[wpm.displayName] = wpm
                    this.plugin.debug(`registered new module <${wpm.displayName}>`)
                }
                    */
          }
        },
        [v]
      )
    } catch (ex) {
      this.plugin.error(ex.message)
      if (!(ex instanceof TypeError && ex.message === 'Cannot read property \'call\' of undefined')) {
        this.plugin.error(ex)
      }
    }

    this._root = document.getElementById('app-mount')
  }

  // This is mess, but it works ! :D
  getName (mod, haha) {
    if (mod.defaultProps !== undefined) {
      if (mod.defaultProps.type === 'button') {
        return 'Buttons'
      } else if (mod.defaultProps.tag === 'h5') {
        return 'Titles'
      } else if (mod.defaultProps.type === 'captcha') {
        // console.log('inject-react inject-found-react', 'something related to captcha')
      } else if (mod.defaultProps.speaking !== undefined) {
        // console.log('inject-react inject-found-react', 'something related to speaking')
      } else if (mod.defaultProps.name === 'Twitch') {
        // console.log('inject-react inject-found-react', 'something related to twitch')
      } else if (mod.defaultProps.makeURL !== undefined) {
        // console.log('inject-react inject-found-react', 'something related to avatar change')
      }
    }
    if (mod.Type !== undefined) {
      if (mod.Type === 'MFA_WARNING') {
        return 'MfaWarning'
      } else if (mod.Type.VIDEO === 'video' && mod.Type.VOICE === 'voice') {
        // console.log('inject-react inject-found-react', 'something related to voice/video calls')
      }
    }
    if (mod.AvatarSizes !== undefined) {
      // console.log('inject-react inject-found-react', 'something related to avatars')
    }
    if (mod.modalConfig !== undefined) {
      if (mod.modalConfig.store._actionHandlers.PRIVACY_SETTINGS_MODAL_CLOSE !== undefined) {
        return 'ModalPrivacySettings'
      } else if (mod.modalConfig.store._actionHandlers.CHANGE_NICKNAME_MODAL_OPEN !== undefined) {
        return 'ModalChangeNickname'
      } else if (mod.modalConfig.store._actionHandlers.CREATE_CHANNEL_MODAL_OPEN !== undefined) {
        return 'ModalCreateChannel'
      } else if (mod.modalConfig.store._actionHandlers.NOTIFICATION_SETTINGS_MODAL_OPEN !== undefined) {
        return 'ModalNotificationSettings'
      } else if (mod.modalConfig.store._actionHandlers.QUICKSWITCHER_SHOW !== undefined) {
        return 'ModalQuickswitcher'
      } else if (mod.modalConfig.store._actionHandlers.SCREENSHARE_MODAL_OPEN !== undefined) {
        return 'ModalScreenshare'
      } else if (mod.modalConfig.store._actionHandlers.PRUNE_GUILD_MODAL_OPEN !== undefined) {
        return 'ModalPruneGuild'
      } else if (mod.modalConfig.store._dispatchToken === 'ID_100') {
        return 'ModalChangeLog'
      }
    }
    if (mod.Statuses !== undefined) {
      // console.log('inject-react inject-found-react', 'avatar with status & speak status')
    }

    let renderFunction = mod.prototype.render.toString()
    if (renderFunction.includes('return s("svg"')) {
      if (renderFunction.includes('M17,10.5 L17,7 C17,6.45 16.55,6 16,6 L4,6 C3.45,6 3,6.45 3,7 L3,17 C3,17.55 3.45,18 4,18 L16,18 C16.55,18 17,17.55 17,17 L17,13.5 L21,17.5 L21,6.5 L17,10.5 Z')) {
        return 'SvgVideoCall'
      } else if (renderFunction.includes('M21,6.5 L17,10.5 L17,7 C17,6.45 16.55,6 16,6 L9.82,6 L21,17.18 L21,6.5 Z M4.73,6 L4,6 C3.45,6 3,6.45 3,7 L3,17 C3,17.55 3.45,18 4,18 L16,18 C16.21,18 16.39,17.92 16.54,17.82 L4.73,6 Z')) {
        return 'SvgStopVideoCall'
      } else if (renderFunction.includes('M20,17 C21.1,17 21.99,16.1 21.99,15 L22,5 C22,3.89 21.1,3 20,3 L4,3 C2.89,3 2,3.89 2,5 L2,15 C2,16.1 2.89,17 4,17 L11,17 L11,19 L9,19 L9,21 L15,21 L15,19 L13,19 L13,17 L20,17 Z M13,13.47 L13,11.28 C10.22,11.28 8.39,12.13 7,14 C7.56,11.33 9.11,8.67 13,8.13 L13,6 L17,9.73 L13,13.47 Z')) {
        return 'SvgScreenShare'
      } else if (renderFunction.includes('M19 13L13 13 13 19 11 19 11 13 5 13 5 11 11 11 11 5 13 5 13 11 19 11')) {
        return 'SvgClose'
      }
      // console.log('inject-react inject-found-react', 'svg')
    } else if (renderFunction.includes('(t === v.SPINNING_CIRCLE)')) {
      return 'SvgSpinningCircle'
    } else if (renderFunction.includes('className:"instant-invite-settings"')) {
      // create invite dialog ?
      // console.log('inject-react inject-found-react', 'something related to instant invites')
    } else if (renderFunction.includes('action:this.handleJumpToChannel')) {
      // jump to... present ?
    } else if (renderFunction.includes('label:c.default.Messages.MARK_AS_READ')) {
      return 'ButtonMarkAsRead'
    } else if (renderFunction.includes('header:p.default.Messages.BAN_CONFIRM_TITLE')) {
      return 'ModalBanUser'
    } else if (renderFunction.includes('header:d.default.Messages.KICK_USER_TITLE')) {
      return 'ModalKickUser'
    } else if (renderFunction.includes('https://support.google.com/accounts/answer/1066447?hl=en')) {
      return 'ModalAdd2FA'
    } else if (renderFunction.includes('c.default.Messages.TRANSFER_OWNERSHIP')) {
      return 'ModalTransferOwnership'
    } else if (renderFunction.includes('speaking:e.speaking,canDrag:i[h.Permissions.MOVE_MEMBERS]')) {
      return 'ChannelVoiceUser'
    } else if (renderFunction.includes('P.default.Messages.NO_SEND_MESSAGES_PERMISSION_PLACEHOLDER')) {
      return 'ChannelTextArea'
    } else if (renderFunction.includes('M.default.pictureInPictureVideo')) {
      return 'VideoPictureInPicture'
    } else if (renderFunction.includes('T.default.Messages.VERIFICATION_PHONE_DESCRIPTION')) {
      return 'ModalVerifyPhone'
    } else if (renderFunction.includes('T.default.Messages.NEW_TERMS_TITLE')) {
      return 'ModalNewToS'
    } else if (renderFunction.includes('b.default.Messages.SHORTCUT_RECORDER_BUTTON_RECORDING')) {
      return 'InputShortcut'
    } else if (renderFunction.includes('c.default.Messages.NSFW_TITLE')) {
      return 'ChannelNsfwWarning'
    } else if (renderFunction.includes('render:this.renderEmojiPickerPopout')) {
      return 'EmojiPickerPopout'
    } else if (renderFunction.includes('S.default.Messages.VERIFY_EMAIL_BODY_RESENT')) {
      return 'ModalEmailVerification'
    } else if (renderFunction.includes('fileName:"discord_backup_codes.txt",')) {
      return 'UserSettings2FA'
    } else if (renderFunction.includes('c.default.Messages.TWO_FA_ENTER_TOKEN_LABEL')) {
      return 'ModalEnter2FAToken'
    } else if (renderFunction.includes('className: "remove-webhook round-remove-button"')) {
      return 'WebhookItem'
    } else if (renderFunction.includes('p.default.Messages.WEBHOOK_MODAL_TITLE')) {
      return 'ModalEditWebhook'
    } else if (renderFunction.includes('c.default.Messages.FORM_LABEL_REPORT_REASON')) {
      return 'ModalReport'
    } else if (renderFunction.includes('c.default.Messages.SETTINGS_NOTICE_MESSAGE')) {
      return 'SettingsUnsavedChanges'
    }

    // console.log('inject-react inject-render-react', haha, prettyJs(renderFunction))
    // return null
  }

  _add (component) {
    if (typeof component === 'string' || !component) return

    let name = component.constructor.displayName || component.displayName
    if (name && name.includes('(')) {
      // kill wrappers!
      name = false
    }

    if (
      this.__components[name] &&
      !component.constructor.toString().includes('native code') &&
      this.__components[name] !== component.constructor
    ) {
      return this.plugin.error(`${name} already defined...`, this.__components[name], component.constructor)
    }

    if (name) {
      this.__components[name] = component.constructor
      if (this.__listener[name]) this.__listener[name].forEach(resolve => resolve(val))
      delete this.__listener[name]
    } else if (component.constructor.displayName || component.displayName) {
      // we decided to ignore this component
    } else {
      return
      this.plugin.debug('Failed to detect component', typeof component, '=>')
      this.plugin.debug(
        '  - Class',
        component.constructor,
        Object.keys(component.constructor),
        component.constructor.defaultProps,
        component.constructor.propTypes
      )
      this.plugin.debug('  - Instance', component, Object.keys(component), component.props, component.displayName)
    }
  }

  get (name) {
    return new Promise(resolve => {
      return resolve(this.components[name])
    })
  }

  get rootInstance () {
    if (!this.__rootInstance) {
      this.__rootInstance = DI.getReactInstance(document.querySelector('#app-mount>*'))
    }

    return this.__rootInstance
  }
}

module.exports = React
