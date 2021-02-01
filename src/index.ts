import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import * as expresWinston from "express-winston"
import * as winstonOpt from "./config/winston"
import routes from "./routes";
dotenv.config()
const whitelist = ['http://example1.com', 'http://example2.com']
const corsOptions = {
    origin: function (origin: any, callback: any) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
}
const app = express()
const port = process.env.PORT
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(expresWinston.logger(winstonOpt.combineOpt))
app.use("/", routes)
app.use(expresWinston.errorLogger(winstonOpt.errorOpt))
app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    res.status(500).send({ message: "ERROR!!", data: {} })
})
app.listen(port, () => console.log(`API Connected on Port ${port}`))