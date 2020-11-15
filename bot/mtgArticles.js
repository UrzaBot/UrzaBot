const DB = require("../data/articlesModel");
const { getParsedArticles } = require("../utils/requestNewsArticles");

async function testArticles(msg) {
  const { content, author, guild } = msg;
  if (author.bot) return;
  const isTestMessage = content.match(/test/gi);
  if (!isTestMessage) return;
  // console.log(guild)
  const newArticles = await getNewArticles();
  newArticles.map(article => {
    console.log(article);
    // DB.addArticle(article).then(console.log);
  });
}

function getNewArticles() {
  // Get all new articles
  return getParsedArticles()
    .then(articles =>
      Promise.all(
        articles.map(article =>
          // Check the database to see if the article is already in it
          DB.getArticleByUrl(article.url).then(articleInDB =>
            // If the article is new, return it, otherwise return null
            !articleInDB ? article : null
          )
        )
      )
    )
    // Remove all the nulls
    .then(results => results.filter(x => x));
}

module.exports = testArticles;
