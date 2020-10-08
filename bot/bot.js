const Discord = require("discord.js");
const cardImages = require("./cardImages");
const mtgArticles = require("./mtgArticles");
const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // setInterval(getMTGArticles,5000);
});

function getMTGArticles(){
  console.log("hi");
}

client.on("message", cardImages);
// client.on("message", mtgArticles)

client.login(process.env.BOT_TOKEN);
