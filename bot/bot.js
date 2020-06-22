const Discord = require("discord.js");
const cardImages = require("./cardImages");
const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  setInterval(getMTGArticles,5000);
});

function getMTGArticles(){
  console.log("hi");
}

client.on("message", cardImages);


module.exports = client;
