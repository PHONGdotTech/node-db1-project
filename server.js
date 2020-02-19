const express = require('express');
const helmet = require("helmet");
const accountsRouter = require("./accounts/accountsRouter.js")

const server = express();

server.use(express.json());
server.use(helmet())
server.use("/api/accounts", accountsRouter)

module.exports = server;