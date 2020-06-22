const { getParsedArticles } = require("../../utils/mtgNewsArticles");

exports.seed = async function (knex) {
  let list = await getParsedArticles();
  for (let i = 10; i < 50; i+=10) {
    const additionalList = await getParsedArticles(
      `https://magic.wizards.com/en/search-magic-ajax?offset=${i}`
    );
    list = list.concat(additionalList);
  }
  return knex("articles").insert(
    list.map(({ imageUrl, ...article }) => ({
      ...article,
      image_url: imageUrl,
    }))
  );
};
