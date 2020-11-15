const knex = require("../data/dbConfig");

function convertFromDB({ image_url, ...article }) {
  return { imageUrl: image_url, ...article };
}

function convertToDB({ imageUrl, ...article }) {
  return { image_url: imageUrl, ...article };
}

function getArticles() {
  return knex("articles").then(r => r.map(convertFromDB));
}

function getArticleByUrl(url) {
  return knex("articles")
    .where({ url })
    .then(r => (r.length > 0 ? convertFromDB(r[0]) : null));
}

function deleteArticle(query) {
  return knex("articles").where(query).delete();
}

function addArticle(article) {
  return knex("articles").insert(convertToDB(article));
}

module.exports = { getArticles, getArticleByUrl, deleteArticle, addArticle };
