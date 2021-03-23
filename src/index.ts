import { create, Client, ChatId, Message, MessageId, decryptMedia, ev } from '@open-wa/wa-automate';
import { extraLog } from './config/winston';
import PQueue from "p-queue"
import { validateRequestQuery } from './config/baseFunction';
import moment from 'moment';
import axios from './config/axios';
import appRoot from "app-root-path"
import fs from "fs"
import path from "path"
import express from "express"
const mime = require("mime-types")
const app = express()
app.use(express.json())
let userId = ""
let timeout = 0
const queue = new PQueue({
    concurrency: 5,
});

app.route("/sendText").post((req: express.Request, res: express.Response) => {

})

const writeFileSyncRecursive = (filename: string, content: any) => {
    return new Promise((resolve, reject) => {
        try {
            let filepath = filename.replace(/\\/g, '/');
            let root = '';
            if (filepath[0] === '/') {
                root = '/';
                filepath = filepath.slice(1);
            }
            else if (filepath[1] === ':') {
                root = filepath.slice(0, 3);
                filepath = filepath.slice(3);
            }
            const folders = filepath.split('/').slice(0, -1);
            folders.reduce(
                (acc, folder) => {
                    const folderPath = acc + folder + '/';
                    if (!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath);
                    }
                    return folderPath
                },
                root
            );
            fs.writeFileSync(root + filepath, content);
            resolve(1)
        } catch (error) {
            reject(error)
        }
    })
}

const mediaProccess = (message: Message) => {
    return new Promise<string>(async (resolve, reject) => {
        try {
            if (message.mimetype) {
                const filename = `${message.t}.${mime.extension(message.mimetype)}`;
                const mediaData = await decryptMedia(message);
                const sender = validateRequestQuery(message.chatId, "num")
                const locFile = path.join(`${appRoot}/../${sender}/${filename}`)
                await writeFileSyncRecursive(locFile, mediaData)
                return resolve(`http://192.168.201.246/${sender}/${filename}`)
            }
        } catch (error) {
            reject(error)
        }
    })
}

const incomingMessage = (client: Client, messageFull: Message) => {
    return new Promise<{ reply: string, from: ChatId, msgId: MessageId }>(async (resolve, reject) => {
        try {
            const caption = messageFull.caption
            const msgId = messageFull.id
            const type = messageFull.type
            const body = messageFull.body
            const msg = type === "image" && caption ? caption : type === "chat" ? body : ""
            let file = ""
            if (messageFull.isMedia && messageFull.mimetype) {
                await mediaProccess(messageFull).then((resp) => { file = resp })
            }
            const base64Msg = validateRequestQuery(Buffer.from(msg).toString("base64"), "numChar")
            const sender = validateRequestQuery(messageFull.from, "num")
            const fromId = messageFull.from
            const rcvdTime = moment().format("YYYY-MM-DD HH:mm:ss")
            const media = "300"
            let reply = ""
            console.log(file)
            extraLog.info({ message: "Message incoming", data: { message: messageFull, sender: sender, chatId: fromId, rcvdTime: rcvdTime } })
            await client.sendSeen(fromId)
            await client.simulateTyping(fromId, true)
            // set api
            await axios.post("https://beta-apivalidasioreoresep.redboxdigital.id/api/v1/validasi", {
                nomor_pengirim: (sender),
                pesan: (base64Msg),
                timestamp: (rcvdTime),
                media: (media),
                photo: Buffer.from(file).toString("base64")
            }, {
                headers: {
                    "api-key": "roy",
                    "api-user": "roy"
                }
            }).then((res) => {
                reply = res.data?.data?.reply ? res.data.data.reply : res.data.message
                extraLog.info({ message: "Success", data: { message: messageFull, sender: sender, chatId: fromId, rcvdTime: rcvdTime }, Response: { data: res.data } })
            }).catch((err) => {
                console.log(err)
                reply = "terjadi kesalahan pada system"
                extraLog.error({ message: "Error", data: { message: messageFull, sender: sender, chatId: fromId, rcvdTime: rcvdTime }, error: err })
            })
            return resolve({
                reply: reply, from: fromId, msgId: msgId
            })
        } catch (error) {
            reject(error)
        }
    })
}

const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const replyChat = (client: Client, message: string, senderId: ChatId, msgId: MessageId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (userId != senderId) {
                timeout = getRandomInt(30000, 60000)
            } else {
                timeout = 0
            }
            if (message != "") {
                // await sleep(timeout)
                // await client.sendSeen(senderId)
                // await client.simulateTyping(senderId, true)
                // userId = senderId
                // await sleep(getRandomInt(1000, 10000))
                await client.sendText(senderId, message)
            } else {
                await client.sendSeen(senderId)
            }
            return resolve(1)
        } catch (error) {
            reject(error)
        }
    })
}

const incomingMessageQueue = (client: Client, message: any) => {
    return queue.add(() => incomingMessage(client, message), { priority: 0 })
};

const incomingCallHandle = (client: Client) => {
    return new Promise((resolve, reject) => {
        try {
            client.onIncomingCall(async call => {
                await client.sendText(call.peerJid, 'Sorry I cannot accept calls');
                await client.contactBlock(call.peerJid)
            });
        } catch (error) {
            reject(error)
        }
    })
}

const sendTextQueue = (clientId: Client, message: string, senderId: ChatId, msgId: MessageId) => {
    return queue.add(() => replyChat(clientId, message, senderId, msgId), { priority: 1 })
}

const start = (client: Client) => {
    return new Promise(async (resolve, reject) => {
        try {
            app.use(client.middleware())
            app.listen(3030, () => {
                console.log('RUNNING ON PORT 3030')
            })
            const unreadMessages = await client.getAllUnreadMessages();
            unreadMessages.forEach(async (res) => {
                const proccess = await incomingMessageQueue(client, res)
                await sendTextQueue(client, proccess.reply, proccess.from, proccess.msgId)
            })
            await client.onMessage(async (res) => {
                const proccess = await incomingMessageQueue(client, res)
                await sendTextQueue(client, proccess.reply, proccess.from, proccess.msgId)
            });
            await incomingCallHandle(client)
            queue.start();
        } catch (error) {
            reject(error)
        }
    })
}

const launch = async () => {
    try {
        const client = await create({
            // throwErrorOnTosBlock: true,
            sessionId: "SERXDCFGVHB8976543",
            useChrome: true,
            headless: true,
            // qrPopUpOnly: true,
            autoRefresh: true,
            qrRefreshS: 20,
            cacheEnabled: true,
            customUserAgent: 'wa-automate'
        })
        await start(client);
    } catch (error) {
        console.log(error)
        extraLog.error({ message: "Failed to start message", error: error })
    }
}
launch()

//1st argument is the session name
//2nd argument is the puppeteer config override
//3rd argument is the user agent override
