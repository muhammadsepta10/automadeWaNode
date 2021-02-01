const mysql = require("mysql2");
import * as dotenv from 'dotenv';
import { database } from "./setting";
dotenv.config()
const nameProgram = process.env.NAME_PROGRAM

const connection = mysql.createPool(database);
connection.getConnection((err: any, connection: any) => {
    if (err) {
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            console.error(`Database ${nameProgram} connection was closed.`);
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
            console.error(`Database ${nameProgram} has too many connections.`);
        }
        if (err.code === "ECONNREFUSED") {
            console.error(`Database ${nameProgram} connection was refused.`);
        } else {
            console.error(`Database ${nameProgram} ${err.code}.`);
        }
    }
    if (connection) {
        console.log(`database ${nameProgram} connected`);
        connection.release();
    }
    return;
});

export default connection
