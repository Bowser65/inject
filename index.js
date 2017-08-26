const Plugin = module.parent.require('../Structures/Plugin');
const Package = require("./package.json");
const { remote } = require('electron');

function similiarObject(a, b) {
    const ka = Object.keys(a)
    const kb = Object.keys(b)
    if (ka.length !== kb.length) return false;

    // no need to reverse check, because both arrays have the same length
    if (ka.some(k => !kb.includes(k) || kb[k] !== ka[k])) return false;
    return true
}

class Inject extends Plugin {
    load() {
        if (this.settings.debug) {
            if (!DI.React) throw new Error("React not found!")
            if (!DI.ReactDOM) throw new Error("ReactDOM not found!")
        }

        this.__patched = []
        this.modules = {}

        const files = _fs.readdirSync(_path.join(__dirname, "modules"))
        files.forEach(file => {
            try {
                require.resolve(_path.join(__dirname, "modules", file))
                const Class = require(_path.join(__dirname, "modules", file))
                const inst = new Class(this)
                this.debug("found module", file, Class.name)
                this.modules[Class.name] = inst
            } catch (ex) {
                this.error(ex)
            }
        })

        Object.keys(this.modules).forEach(name => this.modules[name].load && this.modules[name].load())
        this.render = this.modules.Render
        this.react = this.modules.React
    }

    debug(...args) {
        if (this.settings.debug) this.log(...args)
    }

    _patch(inst, methodName, options) {
        const displayName = options.displayName || inst.displayName || inst.name || inst.constructor.displayName || inst.constructor.name
        const { before, after, instead, once = false } = options

        this.debug('patching in process...', displayName, methodName)
        const method = inst[methodName]

        const cancel = () => {
            this.debug('unpatching in process...', displayName, methodName)
            inst[methodName] = method;
        }

        this.__patched.push(cancel)

        inst[methodName] = function () {
            const data = {
                thisObject: this,
                methodArguments: arguments,
                cancelPatch: cancel,
                originalMethod: method,
                callOriginalMethod: () => data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)
            };
            if (instead) {
                const tempRet = instead(data);
                if (tempRet !== undefined)
                    data.returnValue = tempRet;
            }
            else {
                if (before) before(data);
                data.callOriginalMethod();
                if (after) after(data);
            }
            if (once) cancel();
            return data.returnValue;
        };
        inst[methodName].__monkeyPatched = true;
        inst[methodName].displayName = 'patched ' + (inst[methodName].displayName || methodName);
        return cancel;
    }

    unload() {
        this.__patched.forEach(unpatch => unpatch())
        Object.keys(this.modules).forEach(name => this.modules[name].unload && this.modules[name].unload())
    }
}

module.exports = Inject;