const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { custom404, errorHandling } = require("./config/errors");

const server = express();

server.use(helmet());
server.use(cors());
server.use(express.json());


server.all("*", custom404);
server.use(errorHandling);

module.exports = server;
