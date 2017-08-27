class Render {
  constructor (plugin) {
    this.plugin = plugin
  }

  * recursiveComponents (root) {
    if (!root) root = this.plugin.modules.React.rootInstance

    if (root._instance)
      yield root._instance
    if (root._renderedComponent)
      yield * this.recursiveComponents(root._renderedComponent)
    if (root._renderedChildren)
      for (let child of Object.values(root._renderedChildren))
        yield * this.recursiveComponents(child)
  }

  get components () {
    return this.recursiveComponents()
  }

  patch (Component, actions, filter = false) {
    if (!Array.isArray(actions)) actions = [actions]
    // patch component render method
    const cancel = this.plugin._patch(Component.prototype, 'render', {
      after: (data) => {
        if (!filter || filter(data)) {
          actions.forEach(action => {
            if (action.filter && !action.filter(data)) return
            const {item, parent, key} = this._getFirstChild(data, 'returnValue', action.selector)
            if (!item) return

            const content = typeof action.content === 'function' ? action.content(data.thisObject, item) : action.content
            switch (action.method) {
              case 'prepend':
                item.props.children = [content, item.props.children]
                break
              case 'append':
                item.props.children = [item.props.children, content]
                break
              case 'replaceChildren':
                item.props.children = content
                break
              case 'before':
                parent[key] = [content, parent[key]]
                break
              case 'after':
                parent[key] = [parent[key], content]
                break
              case 'replace':
                parent[key] = content
                break
              default:
                throw new Error('Unexpected method ' + action.method)
            }
          })
        }
      }
    })

    this.eachComponent(Component, c => c.forceUpdate())
    return () => {
      cancel()
      this.eachComponent(Component, c => c.forceUpdate())
    }
  }

  _getFirstChild (rootParent, rootKey, selector) {
    const getDirectChild = item => {
      if (item && item.props && item.props.children) {
        return returnFirst(recursiveArrayCount(item.props, 'children'), checkFilter)
      }
    }
    const checkFilter = ({item, parent, key, count, index}) => {
      let match = true
      if (match && selector.type)
        match = item && selector.type === item.type
      if (match && selector.tag)
        match = item && typeof item.type === 'string' && selector.tag === item.type
      if (match && selector.className) {
        match = item && item.props && typeof item.props.className === 'string'
        if (match) {
          const classes = item.props.className.split(' ')
          if (selector.className === true)
            match = !!classes[0]
          else if (typeof selector.className === 'string')
            match = classes.includes(selector.className)
          else if (selector.className instanceof RegExp)
            match = !!classes.find(cls => selector.className.test(cls))
          else match = false
        }
      }
      if (match && selector.text) {
        if (selector.text === true)
          match = typeof item === 'string'
        else if (typeof selector.text === 'string')
          match = item === selector.text
        else if (selector.text instanceof RegExp)
          match = typeof item === 'string' && selector.text.test(item)
        else match = false
      }
      if (match && selector.nthChild)
        match = index === (selector.nthChild < 0 ? count + selector.nthChild : selector.nthChild)
      if (match && selector.hasChild)
        match = getDirectChild(item, selector.hasChild)
      if (match && selector.hasSuccessor)
        match = item && !!getFirstChild(parent, key, selector.hasSuccessor).item
      if (match && selector.eq) {
        --selector.eq
        return
      }
      if (match) {
        if (selector.child) {
          return getDirectChild(item, selector.child)
        }
        else if (selector.successor) {
          return getFirstChild(parent, key, selector.successor)
        }
        else {
          return {item, parent, key}
        }
      }
    }
    return this.pluin.modules.Util.first(this._recursiveChildren(rootParent, rootKey), checkFilter) || {}
  }

  * _recursiveChildren (parent, key, index = 0, count = 1) {
    let item = parent[key]
    yield {item, parent, key, index, count}

    if (item && item.props && item.props.children) {
      for (let {parent, key, index, count} of recursiveArrayCount(item.props, 'children')) {
        yield * this._recursiveChildren(parent, key, index, count)
      }
    }
  }

  eachComponent (Component, action) {
    return new Promise(resolve => setImmediate(() => {
      for (let component of this.recursiveComponents()) {
        if (component.constructor !== Component && component.constructor.displayName !== Component) continue
        console.log('!!!!!!!!', component)
        action(component)
      }
      resolve()
    }))
  }

  /**
   * Generator for recursive traversal of nested arrays
   * @param {object} parent Parent object which contains target property (array)
   * @param {string} key Key of the target property (array) in parent object.
   * @return {Iterable<TraverseItem>} Returns iterable of objects with item, parent and key properties. If target property is not array, an iterable will be returned with only one element, the target property itself.
   * /
   const recursiveArray = (parent, key, count = 1) => {
                    let index = 0
        
                    function* innerCall(parent, key) {
                        const item = parent[key]
                        if (item instanceof Array) {
                            for (const subKey of item.keys()) {
                                yield* innerCall(item, subKey)
                            }
                        }
                        else {
                            /**
                             @interface
                             @name TraverseItem
                             @property {*} item Current item
                             @property {object} parent Parent object which contains current item
                             @property {string} key Key of the current item in the parent object
                             * /
                            yield {item, parent, key, index: index++, count}
                        }
                    }
        
                    return innerCall(parent, key)
                }

   const recursiveArrayCount = (parent, key) => {
                    let count = 0
                    for (let {} of recursiveArray(parent, key))
                        ++count
                    return recursiveArray(parent, key, count)
                }



   const plannedActions = new Map()
   let plannedPromise, plannedPromiseResolver
   const runPlannedActions = () => {
                    for (let component of recursiveComponents()) {
                        const actions = plannedActions.get(component.constructor) || plannedActions.get(component.constructor.displayName)
                        if (actions) {
                            for (let action of actions) {
                                action(component)
                            }
                        }
                    }
                    plannedPromiseResolver()
                    plannedActions.clear()
                    plannedPromise = null
                    plannedPromiseResolver = null
                }


   /**
   * @interface
   * @name Selector
   * @property {Component} type React component class to match target react component element
   * @property {string} tag Tag name to match target react html element
   * @property {boolean|string|RegExp} className Match react element with className prop. <br/> If `true` is provided - match any element that has className prop. <br/> If string is provided - select element by exact match with any of it space separated classes in className prop. <br/> If RegExp is provided - select element in which regexp matches with any of it space separated classes in className prop.
   * @property {boolean|string|RegExp} text Match text nodes. <br/> If `true` is provided - match any text node. <br/> If string is provided - select text nodes by exact match. <br/> If RegExp is provided - select text nodes which is matched by regexp.
   * @property {number} nthChild Match element only if it is nth child of the parent element. Negative values counts children from the end, ex. -1 means last child.
   * @property {number} eq Selects nth match of selector
   * @property {Selector} hasChild Matches current element only if it has direct child that matches selector
   * @property {Selector} hasSuccessor Matches current element only if it has any successor that matches selector
   * @property {Selector} child Selects direct child of current element that matches selector
   * @property {Selector} successor Selects any successor of current element that matches selector
   */

  /**
   * Use this method to rebind all non react lifecycle methods that you have patched. Discord binds all those methods on component creation, so patching prototype isn"t enough.
   * This method creates a patch to rebind methods on each component creation (mounting)
   * @param {Component} component Component class to rebind methods
   * @param {string[]} methods Array of methods name to rebind
   * @return {cancelPatch} Function with no arguments and no return value that should be called to cancel this patch. You should save and run it when your plugin is stopped.
   * /
   const rebindMethods = (component, methods) => {
                    const rebind = function(thisObject) {
                        for (let method of methods) {
                            thisObject[method] = component.prototype[method].bind(thisObject)
                        }
                        thisObject.forceUpdate()
                    }
                    doOnEachComponent(component, rebind)
                    let cancel
                    if (component.prototype.componentWillMount)
                        cancel = monkeyPatch(component.prototype, "componentWillMount", {
                            silent: true,
                            after: ({thisObject}) => {
                                rebind(thisObject)
                            }
                        })
                    else {
                        component.prototype.componentWillMount = function() {
                            rebind(this)
                        }
                        cancel = () => delete component.prototype.componentWillMount
                    }
                    return () => {
                        cancel()
                        doOnEachComponent(component, rebind)
                    }
                }

   return {
                    patchRender,
                    recursiveArray,
                    _recursiveChildren,
                    recursiveComponents,
                    getFirstChild,
                    doOnEachComponent,
                    rebindMethods
                }
   })()
   */
}

module.exports = Render