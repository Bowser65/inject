class Util {
    constructor() {}
    load() {}
    unload() {}

    first(iterator, process) {
        if (!process) process = () => true

        for (let child of iterator) {
            const retVal = process(child)
            if (retVal !== undefined) return retVal
        }
    }
}

module.exports = Util
