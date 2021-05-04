import { ChatId, Client, MessageId } from '@open-wa/wa-automate';
import PQueue from 'p-queue';
const queue = new PQueue({
    concurrency: 5,
});

const replyChat = (client: Client, message: string, senderId: ChatId, msgId: MessageId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (message != "") {
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


const sendTextQueue = (clientId: Client, message: string, senderId: ChatId, msgId: MessageId) => {
    return queue.add(() => replyChat(clientId, message, senderId, msgId), { priority: 1 })
}

export default sendTextQueue