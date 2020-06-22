const { getParsedArticles } = require("../../utils/mtgNewsArticles");

exports.seed = async function (knex) {
  const list = await getParsedArticles();
  list.map(console.log);
  //const body = root.childNodes[2]; body.childNodes.map((item, idx)=>console.log(`[${idx}]: ${item}`))
  // const article = root.childNodes[1]; console.log(article.rawAttrs);
  // const image = root.childNodes[2]; console.log(image);
  // return knex("roles").insert([
  //   { name: "student" },
  //   { name: "helper" },
  //   { name: "admin" },
  // ]);
};
