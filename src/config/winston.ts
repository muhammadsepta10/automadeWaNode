import * as winston from "winston"
import * as winstonRotate from "winston-daily-rotate-file"
import dotenv from "dotenv"
import * as appRoot from "app-root-path"
dotenv.config()
winstonRotate


const transports = {
    console: new winston.transports.Console({
        format: winston.format.simple()
    }),
    extraLog: new winston.transports.DailyRotateFile({
        filename: `${appRoot}/../logs/${process.env.NAME_PROGRAM}/extra/%DATE%.log`,
        datePattern: "YYY-MM-DD-HH",
        zippedArchive: true,
        maxFiles: "14d",
        maxSize: "100m",
        frequency: "1h"
    }),
}

export const extraLog = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: "DD-MM-YYYY HH:mm:ss",
        }),
        winston.format.json()
    ),
    transports: process.env.NODE_ENV == "development" ? [transports.console] : [transports.extraLog]
})