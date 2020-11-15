const Discord = require("discord.js");
const cardImages = require("./cardImages");
const mtgArticles = require("./mtgArticles");
const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("!help | github.com/urzabot");
  // setInterval(
  //   () => mtgArticles({ author: { bot: false }, content: "test" }),
  //   5000
  // );
});

client.on("message", cardImages);
client.on("message", mtgArticles);

client.login(process.env.BOT_TOKEN);
