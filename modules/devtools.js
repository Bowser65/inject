const electron = require("electron")
const download = require("download")
const decompress = require("decompress")

class Devtools {
    constructor(plugin) {
        this.plugin = plugin
        this.window = electron.remote.getCurrentWindow();
        this.listener = this.listener.bind(this)
        if (this.plugin.settings.devtools === false) return

        const extensionPath = this.extensionPath = _path.join(__dirname, "..", "extension")
        if (!_fs.existsSync(extensionPath)) _fs.mkdirSync(extensionPath)

        Promise.resolve(_fs.existsSync(_path.join(extensionPath, "manifest.json")))
            .then(exists => {
                if (!exists) {
                    this.plugin.debug("downloading extension...", this.extensionURL)
                    return download(this.extensionURL)
                        .then(buffer => {
                            this.plugin.debug("extension downloaded, commencing the extraction")
                            if (buffer.compare(Buffer.from("Cr24", "utf-8"), 0, 4, 0, 4) !== 0) {
                                throw new Error("File has an invalid header. Skipping!")
                            }

                            if (buffer.readUInt32LE(4) != 2) {
                                throw new Error("File uses an unsupported extension format", buffer)
                            }

                            const pubKeyLen = buffer.readUInt32LE(8);
                            const sigKeyLen = buffer.readUInt32LE(12);
                            const zip = buffer.slice(16 + pubKeyLen + sigKeyLen)
                            return decompress(zip, extensionPath, {
                                map: file => {
                                    if (file.path.endsWith("/")) {
                                        file.type = "directory"
                                    }
                                    return file
                                }
                            })
                        })
                        .then(() => {
                            this.plugin.debug("extension extracted!")
                        })
                }
            })
            .then(() => {
                const manifest = this.manifest = require(_path.join(extensionPath, "manifest.json"))
                this.window.webContents.on("devtools-opened", this.listener)
                this.listener()

                this.plugin.debug(`Detected ${manifest.name} v${manifest.version}.`)
            })
            .catch(ex => this.plugin.error("DevTools Extension:", ex))
    }

    get extensionURL() {
        const chromeVersion = process.versions.chrome
        const extensionID = 'fmkadmapgofadopljbjfkapdkoienihi'
        return `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${chromeVersion}&x=id%3D${extensionID}%26uc`
    }

    unload() {
        electron.remote.BrowserWindow.removeDevToolsExtension(this.manifest.name);
        this.window.webContents.removeListener("devtools-opened", this.listener)
    }

    listener() {
        electron.webFrame.registerURLSchemeAsSecure("chrome-extension");
        electron.remote.BrowserWindow.removeDevToolsExtension(this.manifest.name)
        electron.remote.BrowserWindow.addDevToolsExtension(this.extensionPath)
    }
}

module.exports = Devtools