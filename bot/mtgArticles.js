const DB = require("../data/articlesModel");
const knex = require("../data/dbConfig");
const { getParsedArticles } = require("../utils/requestNewsArticles");

async function testArticles(msg) {
  const { content, author } = msg;
  if (author.bot) return;
  const isTestMessage = content.match(/test/gi);
  if (!isTestMessage) return;
  const newArticles = await getNewArticles();
}

function getNewArticles() {
  return getParsedArticles()
    .then(articles =>
      Promise.all(
        articles.map(article =>
          DB.getArticleByUrl(article.url).then(articleInDB =>
            !articleInDB ? article : null
          )
        )
      )
    )
    .then(results => results.filter(x => x));
}

module.exports = testArticles;
