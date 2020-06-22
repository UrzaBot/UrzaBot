const express = require("express");
const knex = require("../data/dbConfig");

const server = express();
server.use(express.json());

server.get("/api", async (req, res) => {
  res.status(200).json(await knex("articles"));
});

module.exports = server;
