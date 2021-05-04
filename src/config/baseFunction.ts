import moment from "moment"
import { decryptMedia, Message } from '@open-wa/wa-automate';
import mime from "mime-types"
import path from "path"
import appRoot from "app-root-path"
import fs from 'fs';
import { google } from "googleapis"
import { config } from "dotenv"
config()
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN || ""
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || ""
const { OAuth2 } = google.auth
const oAuth2Client = new OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
)
oAuth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
    access_token: GOOGLE_ACCESS_TOKEN
})
const people = google.people({
    version: "v1", auth: oAuth2Client
})

export const saveContact = (name: string, phoneNumber: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const searchContact = await people.people.searchContacts({
                query: phoneNumber,
                readMask: "phoneNumbers"
            })
            const lengthContact = searchContact.data?.results ?? 0
            if (lengthContact < 1) {
                await people.people.createContact({
                    requestBody: {
                        names: [
                            {
                                displayName: name

                            },
                        ],
                        phoneNumbers: [{ value: phoneNumber }]
                    },
                });
            }
            return resolve(true)
        } catch (error) {
            reject(error)
        }
    })
}

export const randomString = async (length: number, chars: string, frontText: string) => {
    var result = `${frontText}`;
    const rand = (char: string) => {
        let result = ``
        for (var i = char.length + frontText.length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }
    const afterRand: string = frontText + await rand(chars)
    for (var i = length - (frontText.length); i > 0; --i) result += afterRand[Math.floor(Math.random() * afterRand.length)];
    return result;
}

export const validateRequestQuery = (data: any, type: string) => {
    let clearData: any = "";
    switch (type) {
        case "num":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : parseInt(data.toString().replace(/[^0-9]+/g, "")) == NaN
                        ? ""
                        : data.toString().replace(/[^0-9]+/g, "");
            return clearData;
        case "char":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data
                        .toString()
                        .replace(/[^a-z\d\s]+/gi, "")
            return clearData;
        case "numChar":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data
                        .toString()
                        .replace(/[\W_]+/g, "")
            return clearData;
        case "charSpace":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data
                        .toString()
                        .replace(/[^a-zA-Z ]/g, "")
            return clearData;
        case "numCharSpace":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data
                        .toString()
                        .replace(/[^\w\s]/gi, "")
            return clearData;
        case "any":
            clearData =
                data == undefined ||
                    data == null ||
                    data == "undefined" ||
                    data == "null" ||
                    data == "" ||
                    data == ","
                    ? ""
                    : data;
            return clearData;
        case "rcvd":
            clearData =
                moment(data, "YYYY-MM-DD").format("YYYY-MM-DD").toUpperCase() === "INVALID DATE"
                    ? ""
                    : moment(data).format("YYYY-MM-DD");
            return clearData;
        case "rcvdTime":
            clearData =
                moment(data, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss").toUpperCase() === "INVALID DATE"
                    ? ""
                    : moment(data).format("YYYY-MM-DD HH:mm:ss");
            return clearData;
        default:
            clearData = null;
            return clearData;
    }
};

export const vlaidateHp = (hp: string) => {
    return new Promise((resolve, reject) => {
        try {
            if (hp.length < 6) {
                resolve("")
            } else {
                if (hp.substring(0, 1) == "6") {
                    resolve(hp)
                } else if (hp.substring(0, 2) == "08") {
                    resolve(`62${hp.substring(1)}`)
                } else {
                    resolve(hp)
                }
            }
        } catch (error) {
            reject(error)
        }
    })
}

export const checkOperator = (hp: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const hpValidasi: any = await vlaidateHp(hp)
            const subStringHp = hpValidasi.substring(0, 5);
            if (
                subStringHp == "62859" ||
                subStringHp == "62877" ||
                subStringHp == "62878" ||
                subStringHp == "62817" ||
                subStringHp == "62818" ||
                subStringHp == "62819"
            ) {
                return resolve("XL");
            } else if (
                subStringHp == "62811" ||
                subStringHp == "62812" ||
                subStringHp == "62813" ||
                subStringHp == "62821" ||
                subStringHp == "62822" ||
                subStringHp == "62823" ||
                subStringHp == "62852" ||
                subStringHp == "62853" ||
                subStringHp == "62851"
            ) {
                return resolve("TELKOMSEL");
            } else if (
                subStringHp == "62898" ||
                subStringHp == "62899" ||
                subStringHp == "62895" ||
                subStringHp == "62896" ||
                subStringHp == "62897"
            ) {
                return resolve("TRI");
            } else if (
                subStringHp == "62814" ||
                subStringHp == "62815" ||
                subStringHp == "62816" ||
                subStringHp == "62855" ||
                subStringHp == "62856" ||
                subStringHp == "62857" ||
                subStringHp == "62858"
            ) {
                return resolve("INDOSAT");
            } else if (
                subStringHp == "62889" ||
                subStringHp == "62881" ||
                subStringHp == "62882" ||
                subStringHp == "62883" ||
                subStringHp == "62886" ||
                subStringHp == "62887" ||
                subStringHp == "62888" ||
                subStringHp == "62884" ||
                subStringHp == "62885"
            ) {
                return resolve("SMARTFREN");
            } else if (
                subStringHp == "62832" ||
                subStringHp == "62833" ||
                subStringHp == "62838" ||
                subStringHp == "62831"
            ) {
                return resolve("AXIS");
            } else {
                return resolve("XL");
            }
        } catch (error) {
            reject(error)
        }
    })
};

export const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const writeFileSyncRecursive = (filename: string, content: any) => {
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


export const mediaProccess = (message: Message) => {
    return new Promise<string>(async (resolve, reject) => {
        try {
            if (message.mimetype) {
                const filename = `${message.t}.${mime.extension(message.mimetype)}`;
                const mediaData = await decryptMedia(message);
                const sender = validateRequestQuery(message.from, "num") == "" ? moment().format("YYYYMMDDHHmmss") : validateRequestQuery(message.from, "num")
                const locFile = path.join(`${appRoot}/media/${sender}/${filename}`)
                await writeFileSyncRecursive(locFile, mediaData)
                return resolve(`${filename}`)
            }
        } catch (error) {
            reject(error)
        }
    })
}