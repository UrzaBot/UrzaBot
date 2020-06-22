const knex = require("knex");

const knexConfig = require("../knexfile.js");

const ENV = process.env.DB_ENV || "development";

module.exports = knex(knexConfig[ENV]);
