const knex = require("../data/dbConfig");
const { getParsedArticles } = require("../utils/mtgNewsArticles");

async function testArticles(msg) {
  const { content, author } = msg;
  if (author.bot) return;
  const isTestMessage = content.match(/test/gi);
  if (!isTestMessage) return;
  const currentArticles = await getParsedArticles();
  currentArticles.forEach(({ url }) => {
    knex("articles").where({url}).then(console.log)
  });
}

module.exports = testArticles;
