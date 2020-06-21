const mtg = require("mtgsdk");
const Discord = require("discord.js");

function replyWithCardImage(msg) {
  const { content, author } = msg;
  if (author.bot) return;
  const cardInserts = content.match(/{(.+?)}/g);
  if (!cardInserts) return;
  Promise.all(
    cardInserts
      .map(cardInsert => titleCase(cardInsert))
      .map(name =>
        mtg.card.where({ name }).then(cards => {
          let partialMatches = [];
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
              if (card.name.toLowerCase() === name.toLowerCase()) {
                return true;
              }
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
            sendEmbed(msg, card);
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
function sendEmbed(msg, card) {
  let embed;
  if (card.imageUrl) {
    embed = new Discord.MessageEmbed()
      .setTitle(card.name)
      .setImage(card.imageUrl);
  } else {
    //console.log(card);
    embed = new Discord.MessageEmbed()
      .setTitle(card.name)
      .addFields(
        { name: "Type", value: card.type, inline: true },
        { name: "Cost", value: card.manaCost, inline: true },
        { name: "Text", value: card.text },
        { name: "Set", value: card.setName, inline: true },
        { name: "Rarity", value: card.rarity, inline: true }
      );
  }
  msg.channel.send(embed);
}

function pollForCorrectCard(name, msg, matchingCards) {
  return msg.channel
    .send(
      `I found several cards matching ${name}. Which did you mean?\n${matchingCards
        .reduce(
          (list, card, idx) =>
            idx === emojisForMultipleCardResults.length
              ? list + "❌ None of these\n(Too many results to show them all...) "
              : idx < emojisForMultipleCardResults.length
              ? list + `${discordEmojiForNumber(idx)} ${card.name}\n`
              : list,
          ""
        )
        .slice(0, -1)}`
    )
    .then(pollMessage => {
      const filter = (reaction, user) =>
        (emojisForMultipleCardResults.includes(reaction.emoji.name) ||
          reaction.emoji.name === "❌") &&
        user.id !== pollMessage.author.id;
      const collector = pollMessage.createReactionCollector(filter, {
        max: 1,
        time: 1000 * 60 * 5,
      });
      //console.log(matchingCards.length);
      Promise.all(
        matchingCards.map((x, idx) => {
          if (idx === emojisForMultipleCardResults.length + 1) {
            return pollMessage.react("❌");
          }
          const emoji = discordEmojiForNumber(idx);
          return emoji ? pollMessage.react(emoji) : Promise.resolve();
        })
        //an error will be thrown if a user answers the poll before all reactions post
        //we can safely ignore it
      ).catch(() => null);

      collector
        .on("collect", r => {
          const idx = emojisForMultipleCardResults.findIndex(
            item => item === r.emoji.name
          );
          if (idx !== -1) {
            const card = matchingCards[idx];
            sendEmbed(msg, card);
          }
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
  "🤎",
  "❤️",
  "💚",
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
