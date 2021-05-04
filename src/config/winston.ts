import * as winston from "winston"
import * as winstonRotate from "winston-daily-rotate-file"
import dotenv from "dotenv"
import * as appRoot from "app-root-path"
import * as expresWinston from 'express-winston';
dotenv.config()
winstonRotate


const transports = {
    error: new winston.transports.DailyRotateFile({
        filename: `${appRoot}/../logs/${process.env.NAME_PROGRAM}/error/%DATE%.log`,
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: true,
        maxFiles: "14d",
        maxSize: "100m",
        frequency: "1h"
    }),
    combine: new winston.transports.DailyRotateFile({
        filename: `${appRoot}/../logs/${process.env.NAME_PROGRAM}/combine/%DATE%.log`,
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: true,
        maxFiles: "14d",
        maxSize: "100m",
        frequency: "1h"
    }),
    console: new winston.transports.Console({
        format: winston.format.simple()
    }),
    extraLog: new winston.transports.DailyRotateFile({
        filename: `${appRoot}/../logs/${process.env.NAME_PROGRAM}/extra/%DATE%.log`,
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: true,
        maxFiles: "14d",
        maxSize: "100m",
        frequency: "1h"
    }),
}

export const combineOpt = {
    format: winston.format.combine(
        winston.format.timestamp({
            format: "DD-MM-YYYY HH:mm:ss",
        }),
        winston.format.json()
    ),
    meta: true,
    responseWhitelist: [...expresWinston.responseWhitelist, 'body'],
    requestWhitelist: ['body', 'query', 'params', 'method', 'originalUrl', 'headers.x-forwarded-for', 'connection.remoteAddress'],
    transports: process.env.NODE_ENV == "development" ? [transports.console] : [transports.combine],
}

export const errorOpt = {
    format: winston.format.combine(
        winston.format.timestamp({
            format: "DD-MM-YYYY HH:mm:ss",
        }),
        winston.format.json(),
        winston.format.colorize()
    ),
    responseWhitelist: [...expresWinston.responseWhitelist, 'body'],
    requestWhitelist: ['body', 'query', 'params', 'method', 'originalUrl', 'headers.x-forwarded-for', 'connection.remoteAddress'],
    transports: process.env.NODE_ENV == "development" ? [transports.console] : [transports.error]
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