import { smsg } from './lib/simple.js'
import { format } from 'util' 
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import fs, { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'
import ws from 'ws'

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate)
        return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m)
        return;
    if (globalThis.db.data == null)
        await globalThis.loadDatabase()
    try {
        m = smsg(this, m) || m
        if (!m)
            return
        globalThis.mconn = m
        m.exp = 0
        try {
            const user = globalThis.db.data.users[m.sender]
            if (typeof user !== "object")

                globalThis.db.data.users[m.sender] = {}
            if (user) {

                if (!("name" in user))
                    user.name = m.name
                if (!("coins" in user))
                    user.coins = m.name
                if (!("bank" in user))
                    user.bank = m.name
                if (!("exp" in user))
                    user.exp = "0"
                if (!("usedcommands" in user))
                    user.usedcommands = "0"
                if (!("level" in user))
                    user.level = "0"
            } else
                globalThis.db.data.users[m.sender] = {
                    name: m.name,
                    coins: 0,
                    bank: 0,
                    exp: 0,
                    usedcommands: 0,
                    level: 0,
                }
            const chat = globalThis.db.data.chats[m.chat]
            if (typeof chat !== "object")
                globalThis.db.data.chats[m.chat] = {}
            if (chat) {
                if (!("welcome" in chat))
                    chat.welcome = true
                if (!("nsfw" in chat))
                    chat.nsfw = false
                if (!("alerts" in chat))
                    chat.alerts = true
                if (!("adminonly" in chat))
                    chat.adminonly = false
                if (!("antilinks" in chat))
                    chat.antilinks = true
                if (!("bannedGrupo" in chat))
                    chat.bannedGrupo = false
                if (!isNumber(chat.expired))
                    chat.expired = 0
} else {
                globalThis.db.data.chats[m.chat] = {
                    welcome: true,
                    nsfw: false,
                    alerts: true,
                    adminonly: false,
                    antilinks: true,
                    bannedGrupo: false,
                }                  
}
        if (typeof m.text !== "string")
            m.text = ""
        const user = globalThis.db.data.users[m.sender]
        const chat = globalThis.db.data.chats[m.chat]
        const isOwner = [...globalThis.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
        if (opts["queque"] && m.text && !(isMods)) {
            const queque = this.msgqueque, time = 1000 * 5
            const previousID = queque[queque.length - 1]
            queque.push(m.id || m.key.id)
            setInterval(async function () {
                if (queque.indexOf(previousID) === -1) clearInterval(this)
                await delay(time)
            }, time)
        }
        if (m.isBaileys) {
            return
        }
        m.exp += Math.ceil(Math.random() * 10)
        let usedPrefix
        const groupMetadata = (m.isGroup ? ((conn.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(_ => null)) : {}) || {}
        const participants = (m.isGroup ? groupMetadata.participants : []) || []
        const userGroup = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {}
        const botGroup = m.isGroup ? participants.find(u => conn.decodeJid(u.id) === this.user.jid) : "";
        const isRAdmin = userGroup?.admin == "superadmin" || false
        const isAdmin = isRAdmin || userGroup?.admin == "admin" || false
        const isBotAdmin = botGroup?.admin;

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins")
        for (const name in globalThis.plugins) {
            const plugin = globalThis.plugins[name]
            if (!plugin)
                continue
            if (plugin.disabled)
                continue
            const __filename = join(___dirname, name)

            if (typeof plugin.all === "function") {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        ___dirname,
                        __filename,
                        user,
                        chat,
                        setting
                    })
                } catch (err) {
                    console.error(err)
                }
            }
            if (!opts["restrict"])
                if (plugin.tags && plugin.tags.includes("admin")) {
                    continue
                }
            const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
            const pluginPrefix = plugin.customPrefix || conn.prefix || globalThis.prefix
            const match = (pluginPrefix instanceof RegExp ?
                [[pluginPrefix.exec(m.text), pluginPrefix]] :
                Array.isArray(pluginPrefix) ?
                    pluginPrefix.map(prefix => {
                        const regex = prefix instanceof RegExp ?
                            prefix :
                            new RegExp(strRegex(prefix))
                        return [regex.exec(m.text), regex]
                    }) :
                    typeof pluginPrefix === "string" ?
                        [[new RegExp(strRegex(pluginPrefix)).exec(m.text), new RegExp(strRegex(pluginPrefix))]] :
                        [[[], new RegExp]]
            ).find(prefix => prefix[1])
                 if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    isOwner,
                    isModeration,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    chatUpdate,
                    ___dirname,
                    __filename,
                    chat
                })) {
                    continue
                }
            }
            if (typeof plugin !== "function") {
                continue
            }
            if ((usedPrefix = (match[0] || "")[0])) {
                const noPrefix = m.text.replace(usedPrefix, "")
                let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split(" ").slice(1)
                let text = _args.join(" ")
                command = (command || "").toLowerCase()
                const fail = plugin.fail || globalThis.dfail
                const isAccept = plugin.command instanceof RegExp ?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ?
                        plugin.command.some(cmd => cmd instanceof RegExp ?
                            cmd.test(command) :
                            cmd === command) :
                        typeof plugin.command === "string" ?
                            plugin.command === command :
                            false

                globalThis.comando = command

                if (!isAccept) {
                    continue
                }          

                m.plugin = name
                if (chat) {

                    if (name !== "grupo-mute.js" && chat?.bannedGrupo && !isOwner) return
             }

                const adminMode = chat.adminonly || false
                const wa = plugins.botAdmin || plugins.admin || plugins.group || plugins || noPrefix || pluginPrefix || m.text.slice(0, 1) === pluginPrefix || plugins.command
                if (adminMode && !isOwner && m.isGroup && !isAdmin && wa) return
                if (plugin.owner && !(isOwner)) {
                    fail("owner", m, this)
                    continue
                }
                if (plugin.owner && !isOwner) {
                    fail("owner", m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) {
                    fail("botAdmin", m, this)
                    continue
                } else if (plugin.admin && !isAdmin) {
                    fail("admin", m, this)
                    continue
                }
                m.isCommand = true
                m.exp += plugin.exp ? parseInt(plugin.exp) : 10
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    chat,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    chatUpdate,
                    ___dirname,
                    __filename
                }
                try {
                    await plugin.call(this, m, extra)
                } catch (err) {
                    m.error = err
                    // console.error(err)
                } finally {
                    if (typeof plugin.after === "function") {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (err) {
                            // console.error(err)
                        }
                    }
                }
            }
        }
    } catch (err) {
        // console.error(err)
    } finally {
        if (opts["queque"] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }

            if (!opts["noprint"]) await (await import(`./lib/console.js`)).default(m, this)
        }
    }
}

globalThis.dfail = (type, m, conn) => {
    const msg = {
        owner: `🎍 El comando *${comando}* solo puede ser ejecutado por mi Creador.`,
        moderation: `🎍 El comando *${comando}* solo puede ser ejecutado por los moderadores.`,
        admin: `🎍 El comando *${comando}* solo puede ser ejecutado por los Administradores del Grupo.`,
        botAdmin: `🎍 El comando *${comando}* solo puede ser ejecutado si el Socket es Administrador del Grupo.`
    }[type];
    if (msg) return m.reply(msg)
}