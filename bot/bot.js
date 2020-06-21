const mtg = require("mtgsdk");
const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", msg => {
  const { content, author, channel } = msg;
  if (author.bot) return;
  const matches = content.match(/{(.+?)}/g);
  if (!matches) return;
  matches
    .map(match => titleCase(match))
    .map(name =>
      mtg.card.where({ name }).then(cards => {
        let matchingCards = cards
          .reduce((list, current) => {
            const foundIndex = list.findIndex(n => n.name === current.name);
            if (foundIndex === -1) {
              return list.concat(current);
            }
            if (current.imageUrl) {
              list[foundIndex] = current;
            }
            return list;
          }, [])
          .filter(card => {
            if (card.name === name) return true;
            const firstWord = card.name.split(" ")[0];
            return firstWord.includes(name) && !firstWord.includes("'s");
          });
        //matchingCards.map(c => console.log(c.name));
        if (matchingCards.length === 0) {
          msg.reply(`I couldn't find a card named ${name}`);
        } else if (matchingCards.length === 1) {
          let card = matchingCards[0];
          const embed = new Discord.MessageEmbed()
            .setTitle(card.name)
            .setImage(card.imageUrl);
          channel.send(embed);
        } else {
          msg
            .reply(
              `I found several cards matching ${name}. Which did you mean?\n${matchingCards
                .reduce(
                  (list, card, idx) =>
                    list + `${discordEmojiForNumber(idx)} ${card.name}\n`,
                  ""
                )
                .slice(0, -1)}`
            )
            .then(msg => {
              for (let i = 0; i < matchingCards.length; i++) {
                console.log(discordEmojiForNumber(i));
               // msg.react(discordEmojiForNumber(i));
              }
            });
        }
      })
    );
  function discordEmojiForNumber(number) {
    const emojis = [
      ":one:",
      ":two:",
      ":three:",
      ":four:",
      ":five:",
      ":six:",
      ":seven:",
      ":eight:",
      ":nine:",
      ":ten:",
      ":a:",
      ":b:",
      ":c:",
      ":d:",
      ":e:",
      ":f:",
      ":g:",
      ":h:",
      ":i:",
      ":j:",
      ":k:",
      ":l:",
      ":m:",
      ":n:",
      ":o:",
      ":p:",
      ":q:",
      ":r:",
      ":s:",
      ":t:",
      ":u:",
      ":v:",
      ":w:",
      ":x:",
      ":y:",
      ":z:",
    ];
    return number < 36 ? emojis[number] : null;
  }
  function titleCase(string) {
    return string
      .slice(1, -1)
      .toLowerCase()
      .split(" ")
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }
});

module.exports = client;
