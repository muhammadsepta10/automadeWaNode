import { extraLog } from '../config/winston';
import { validateRequestQuery, mediaProccess, saveContact } from '../config/baseFunction';
import { Client, Message, ChatId, MessageId } from '@open-wa/wa-automate';
import axios from '../config/axios';
import moment from 'moment';
import PQueue from 'p-queue';
const queue = new PQueue({
    concurrency: 5,
});
import { config } from "dotenv"
config()
const urlValidasi = process.env.URL_VALIDASI || ""
// 762278750325-ciuirdpd9ehjdhgfjm2q1ttgg3clbn6t.apps.googleusercontent.com
// -QRVg4_dN8CMmCth9NxpN5zB

const incomingMessageQueue = (client: Client, message: any) => {
    return queue.add(() => incomingMessage(client, message), { priority: 0 })
};


const incomingMessage = (client: Client, messageFull: Message) => {
    return new Promise<{ reply: string, from: ChatId, msgId: MessageId }>(async (resolve, reject) => {
        try {
            const caption = messageFull.caption
            const msgId = messageFull.id
            const type = messageFull.type
            const body = messageFull.body
            const name = messageFull.sender.pushname
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
            extraLog.info({ message: "Message incoming", data: { message: messageFull, sender: sender, chatId: fromId, rcvdTime: rcvdTime } })
            await client.sendSeen(fromId)
            await client.simulateTyping(fromId, true)
            // set api
            saveContact(name, sender)
            await axios.post(urlValidasi, {
                nomor_pengirim: (sender),
                pesan: (base64Msg),
                timestamp: (rcvdTime),
                media: (media),
                photo: Buffer.from(file).toString("base64")
            }).then((res) => {
                reply = res.data?.data?.reply ? res.data.data.reply : res.data.message
                extraLog.info({ message: "Success", data: { message: messageFull, sender: sender, chatId: fromId, rcvdTime: rcvdTime }, Response: { data: res.data } })
            }).catch((err) => {
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

export default incomingMessageQueue