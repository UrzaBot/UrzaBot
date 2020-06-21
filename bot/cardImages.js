const mtg = require("mtgsdk");
const Discord = require("discord.js");

function replyWithCardImage(msg) {
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
            .then(async pollMessage => {
              const filter = (reaction, user) =>
                emojisForMultipleCardResults.includes(reaction.emoji.name) &&
                user.id !== pollMessage.author.id;
              const collector = pollMessage.createReactionCollector(filter, {
                max: 1,
                time: 1000 * 60 * 5,
              });

              Promise.all(
                matchingCards.map((x, idx) => {
                  const emoji = discordEmojiForNumber(idx);
                  return emoji ? pollMessage.react(emoji) : Promise.resolve();
                })
              ).catch(() => console.log("poll terminated early"));

              collector
                .on("collect", r => {
                  const idx = emojisForMultipleCardResults.findIndex(
                    item => item === r.emoji.name
                  );
                  const card = matchingCards[idx];
                  const embed = new Discord.MessageEmbed()
                    .setTitle(card.name)
                    .setImage(card.imageUrl);
                  channel.send(embed);
                })
                .on("end", r => {
                  pollMessage.delete();
                });
            });
        }
      })
    );
}

/*----------------------------------------------------------------------------*/
/* Helper functions
/*----------------------------------------------------------------------------*/
const emojisForMultipleCardResults = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "0️⃣",
  "🅰️",
  "🅱️",
  "🤍",
  "💙",
  "🖤",
  "❤️",
  "💚",
  "♠️",
  "♦️",
  "♣️",
];
function discordEmojiForNumber(number) {
  return number < emojisForMultipleCardResults.length
    ? emojisForMultipleCardResults[number]
    : null;
}
function titleCase(string) {
  return string
    .slice(1, -1)
    .toLowerCase()
    .split(" ")
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

module.exports = replyWithCardImage;
