const knex = require("../data/dbConfig");

async function testArticles(msg){
  const { content, author } = msg;
  if (author.bot) return;
  const isTestMessage = content.match(/test/ig);
  if (!isTestMessage) return;
  knex("articles").then(r => r.map(console.log));
}

module.exports = testArticles;