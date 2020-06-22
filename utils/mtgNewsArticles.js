const { parse } = require("node-html-parser");
const axios = require("axios");

function parseArticle(article) {
  const root = parse(article).querySelector("div.article-item-extended a");
  const url = root.rawAttrs
    .replace(/href=\"/, '"https://magic.wizards.com')
    .replace(/"/g, "");
  //root.childNodes.map((item, idx) => console.log(`[${idx}]: ${item}`));
  const imageUrl = root.querySelector("div.image").rawAttrs.split("'")[1];
  const body = root.querySelector("div.text");
  const category = body.querySelector("h4 span").firstChild.rawText;
  const dateSpan = body.querySelector("span.date");
  const month = dateSpan.querySelector("span.month").firstChild.rawText.trim();
  const day = dateSpan.querySelector("span.day").firstChild.rawText.trim();
  const year = dateSpan.querySelector("span.year").firstChild.rawText.trim();
  const date = `${year}-${monthNameToNumber(month)}-${day}`;
  const title = body.querySelector("div.title h3").firstChild.rawText;
  const author = body.querySelector("span.author").firstChild.rawText.slice(3);
  return { url, date, imageUrl, title, category, author };
}

function monthNameToNumber(name) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const number =
    months.findIndex(m => m.toLowerCase() === name.toLowerCase()) + 1;
  return number < 10 ? `0${number}` : number;
}

function getArticles(url) {
  return axios.get(url).then(r => r.data.data);
}

async function getParsedArticles(
  url = "https://magic.wizards.com/en/search-magic-ajax"
) {
  const articles = await getArticles(url);
  return articles.map(article => parseArticle(article));
}

module.exports = { getParsedArticles };
