import { create, Client } from '@open-wa/wa-automate';
import { extraLog } from './config/winston';
import incomingMessageQueue from './gatewayControllers/incomingMessage';
import sendTextQueue from './gatewayControllers/replyChat';
import { config } from "dotenv"
config()
const start = (client: Client) => {
    return new Promise(async (resolve, reject) => {
        try {
            const unreadMessages = await client.getAllUnreadMessages();
            unreadMessages.forEach(async (res) => {
                const proccess = await incomingMessageQueue(client, res)
                await sendTextQueue(client, proccess.reply, proccess.from, proccess.msgId)
            })
            await client.onMessage(async (res) => {
                const proccess = await incomingMessageQueue(client, res)
                await sendTextQueue(client, proccess.reply, proccess.from, proccess.msgId)
            });
            client.onIncomingCall(async call => {
                await client.sendText(call.peerJid, 'Sorry I cannot accept calls');
            });
        } catch (error) {
            reject(error)
        }
    })
}

const launch = async () => {
    try {
        const client = await create({
            throwErrorOnTosBlock: true,
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
        extraLog.error({ message: "Failed to start message", error: error })
    }
}
launch()