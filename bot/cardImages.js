const mtg = require("mtgsdk");
const Discord = require("discord.js");

function replyWithCardImage(msg) {
  const { content, author } = msg;
  if (author.bot) return;
  const cardInserts = content.match(/{(.+?)}/g);
  if (!cardInserts) return;
  let partialMatches = [];
  Promise.all(
    cardInserts
      .map(match => titleCase(match))
      .map(name =>
        mtg.card.where({ name }).then(cards => {
          let exactMatches = cards
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
              if (card.name.toLowerCase() === name.toLowerCase()) return true;
              const firstWord = card.name.split(" ")[0];
              if (firstWord.includes(name) && !firstWord.includes("'s")) {
                return true;
              }
              partialMatches.push(card);
              return false;
            });
          //matchingCards.map(c => console.log(c.name));
          if (exactMatches.length === 0) {
            if (partialMatches.length === 0) {
              msg.reply(`I couldn't find a card named ${name}`);
            } else {
              pollForCorrectCard(name, msg, partialMatches);
            }
          } else if (exactMatches.length === 1) {
            let card = exactMatches[0];
            const embed = new Discord.MessageEmbed()
              .setTitle(card.name)
              .setImage(card.imageUrl);
            msg.channel.send(embed);
          } else {
            pollForCorrectCard(name, msg, exactMatches);
          }
        })
      )
  );
}

/*----------------------------------------------------------------------------*/
/* Helper functions
/*----------------------------------------------------------------------------*/
function pollForCorrectCard(name, msg, matchingCards) {
  return msg.channel
    .send(
      `I found several cards matching ${name}. Which did you mean?\n${matchingCards
        .reduce(
          (list, card, idx) =>
            list + `${discordEmojiForNumber(idx)} ${card.name}\n`,
          ""
        )
        .slice(0, -1)}`
    )
    .then(pollMessage => {
      const filter = (reaction, user) =>
        emojisForMultipleCardResults.includes(reaction.emoji.name) &&
        user.id !== pollMessage.author.id;
      const collector = pollMessage.createReactionCollector(filter, {
        max: 1,
        time: 1000 * 60 * 5,
      });
      //console.log(matchingCards.length);
      Promise.all(
        matchingCards.map((x, idx) => {
          const emoji = discordEmojiForNumber(idx);
          return emoji ? pollMessage.react(emoji) : Promise.resolve();
        })
      ).catch(() => null);

      collector
        .on("collect", r => {
          const idx = emojisForMultipleCardResults.findIndex(
            item => item === r.emoji.name
          );
          const card = matchingCards[idx];
          const embed = new Discord.MessageEmbed()
            .setTitle(card.name)
            .setImage(card.imageUrl);
          msg.channel.send(embed);
        })
        .on("end", r => {
          pollMessage.delete();
        });
    });
}
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
