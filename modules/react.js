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
                let name = this.getName(mod)
                if (name === undefined) {
                  this.plugin.debug(
                    'inject-react inject-found-react',
                    unkown++,
                    'found unkown object that looks like a react component',
                    mod
                  )
                } else {
                  this.components[name] = mod
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

  getName(mod) {
    if (mod.defaultProps !== undefined) {
      if (mod.defaultProps.type === 'button') {
        return 'Buttons'
      } else if (mod.defaultProps.tag === 'h5') {
        return 'Titles'
      } else if (mod.defaultProps.type === 'captcha') {
        // console.log('inject-react inject-found-react', 'something related to captcha')
      } else if (mod.defaultProps.speaking !== undefined) {
        // console.log('inject-react inject-found-react', 'something related to speaking')
      } else if (mod.defaultProps.name === "Twitch") {
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
