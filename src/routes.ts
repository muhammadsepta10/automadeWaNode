import * as express from "express";
const swaggerUi = require("swagger-ui-express");
import * as specs from "./config/swagger";

let router = express.Router();

router.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs.specs, { explorer: true })
);

router.get("/", (req, res) => res.send(`WELCOME TO API ${process.env.NAME_PROGRAM}`))

export default router