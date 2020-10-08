const knex = require("../data/dbConfig");

function testArticles(msg){
  const { content, author } = msg;
  if (author.bot) return;
  const isTestMessage = content.match(/test/ig);
  if (!isTestMessage) return;
  msg.reply(await knex("articles"))
}

module.exports = testArticles;