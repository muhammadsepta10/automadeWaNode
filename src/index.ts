import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import * as expresWinston from "express-winston"
import * as winstonOpt from "./config/winston"
import routes from "./routes";
dotenv.config()
var allowedOrigins = [`http://localhost:${process.env.PORT}`];
const app = express()
const port = process.env.PORT
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin 
        // (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));
app.use(expresWinston.logger(winstonOpt.combineOpt))
app.use("/", routes)
app.use(expresWinston.errorLogger(winstonOpt.errorOpt))
app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    res.status(500).send({ message: "ERROR!!", data: {} })
})
app.listen(port, () => console.log(`API Connected on Port ${port}`))