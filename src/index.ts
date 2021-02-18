import { create, Client, ChatId } from '@open-wa/wa-automate';
import { extraLog } from './config/winston';
import PQueue from "p-queue"
import { validateRequestQuery } from './config/baseFunction';
import moment from 'moment';
import axios from './config/axios';
let userId = ""
let timeout = 0
const queue = new PQueue({
    concurrency: 1,
});

const queueSend = new PQueue({
    concurrency: 1,
})

const proc = (messageFull: any) => {
    return new Promise<{ reply: string, from: ChatId }>(async (resolve, reject) => {
        try {
            const caption = messageFull.caption
            const type = messageFull.type
            const body = messageFull.body
            const msg = type === "image" && caption ? caption : type === "chat" ? body : ""
            const base64Msg = Buffer.from(msg).toString("base64")
            const sender = validateRequestQuery(messageFull.from, "num")
            const fromId = messageFull.from
            const rcvdTime = moment().format("YYYY-MM-DD HH:mm:ss")
            const media = "300"
            let reply = ""
            extraLog.info({ message: "Message incoming", data: { message: messageFull, sender: sender, chatId: fromId, rcvdTime: rcvdTime } })
            await axios.post("https://dev-apibigbabol.redboxdigital.id/api/v1/validasi", {
                msisdn: sender,
                mo_text: base64Msg,
                media: media,
                receive_at: rcvdTime
            }).then((res) => {
                reply = res.data.data.reply ? res.data.data.reply : ""
                extraLog.info({ message: "Success", data: { message: messageFull, sender: sender, chatId: fromId, rcvdTime: rcvdTime }, Response: { data: res.data } })
            }).catch((err) => {
                reply = "terjadi kesalahan pada system"
                extraLog.error({ message: "Error", data: { message: messageFull, sender: sender, chatId: fromId, rcvdTime: rcvdTime }, error: err })
            })
            return resolve({
                reply: reply, from: fromId
            })
        } catch (error) {
            reject(error)
        }
    })
}

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const sendText = (client: Client, message: string, senderId: ChatId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (userId != senderId) {
                timeout = getRandomInt(30000, 60000)
            } else {
                timeout = 0
            }
            console.log(timeout)
            await sleep(timeout)
            await client.sendSeen(senderId)
            await client.simulateTyping(senderId, true)
            userId = senderId
            setTimeout(() => {
                return client.sendText(senderId, message)
            }, getRandomInt(5000, 10000));
            return resolve(1)
        } catch (error) {
            reject(error)
        }
    })
}

const processMessage = (message: any) => {
    return queue.add(() => proc(message), { priority: 0 })
};

const incomingCall = (client: Client) => {
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

const proccessSendText = (clientId: Client, message: string, senderId: ChatId) => {
    return queue.add(() => sendText(clientId, message, senderId), { priority: 1 })
}

const start = (client: Client) => {
    return new Promise(async (resolve, reject) => {
        try {
            const unreadMessages = await client.getAllUnreadMessages();
            unreadMessages.forEach(async (res) => {
                const proccess = await processMessage(res)
                await proccessSendText(client, proccess.reply, proccess.from)
            })
            await client.onMessage(async (res) => {
                const proccess = await processMessage(res)
                await proccessSendText(client, proccess.reply, proccess.from)
            });
            await incomingCall(client)
            queue.start();
        } catch (error) {
            reject(error)
        }
    })
}

async function launch() {
    try {
        const client = await create({
            useChrome: true,
            headless: true,
            autoRefresh: true,
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
