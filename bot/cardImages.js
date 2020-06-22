const mtg = require("mtgsdk");
const Discord = require("discord.js");
const axios = require("axios");

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
function convertText(text) {
  const symbolsMap = {
    X: "<:manax:724462885149081683>",
    "W/U": "<:manawu:724461530531495977>",
    "U/B": "<:manaub:724461530426507324>",
    "W/P": "<:manawp:724461530422181939>",
    W: "<:manaw:724461530380238861>",
    "U/P": "<:manaup:724461530351140925>",
    T: "<:tap:724461530233569330>",
    "U/R": "<:manaur:724461530200145981>",
    "R/W": "<:manarw:724461530128711680>",
    G: "<:manag:724461530107740180>",
    "R/G": "<:manarg:724461530099351562>",
    U: "<:manau:724461529981779979>",
    Q: "<:untap:724461529973653515>",
    B: "<:manab:724461529889767504>",
    E: "<:energy:724461529885442058>",
    "R/P": "<:manarp:724461529860407337>",
    "G/U": "<:managu:724461529843367936>",
    C: "<:manac:724461529822396446>",
    S: "<:manas:724461529818464287>",
    "G/P": "<:managp:724461529818202122>",
    "B/G": "<:manabg:724461529759744020>",
    R: "<:manar:724461529734447186>",
    "B/P": "<:manabp:724461529650692177>",
    "B/R": "<:manabr:724461529637978163>",
    "7": "<:mana7:724461528375361556>",
    "20": "<:mana20:724461528274698300>",
    "16": "<:mana16:724461528257921024>",
    "11": "<:mana11:724461528211914762>",
    "8": "<:mana8:724461528195006474>",
    A: "<:manaa:724461528190812241>",
    "14": "<:mana14:724461528169840710>",
    "13": "<:mana13:724461528149131434>",
    "2/B": "<:mana2b:724461528136548412>",
    "2/R": "<:mana2r:724461528132091974>",
    "2/W": "<:mana2w:724461528128159784>",
    "9": "<:mana9:724461528128159754>",
    "12": "<:mana12:724461528123965460>",
    "10": "<:mana10:724461528098799647>",
    "5": "<:mana5:724461528090279957>",
    "15": "<:mana15:724461528035622953>",
    "2/U": "<:mana2u:724461528027234477>",
    "6": "<:mana6:724461528019107910>",
    "1": "<:mana1:724461527876501524>",
    "2/G": "<:mana2g:724461527872176198>",
    "0": "<:mana0:724461527838752889>",
    "3": "<:mana3:724461527783964745>",
    "4": "<:mana4:724461527737958401>",
    "2": "<:mana2:724461527750672476>",
  };
  function matcher(match, ...groups) {
    const string = groups.pop();
    const offset = groups.pop();
    groups.forEach(symbol => {
      const regex = new RegExp(`\\{${symbol}\\}`);
      text = text.replace(regex, symbolsMap[symbol] || `{${symbol}}`);
    });
    return text;
  }
  text.replace(/{(.+?)}/g, matcher);
  return text;
}

async function sendEmbed(msg, card) {
  let embed;
  if (!card.imageUrl) {
    const multiverseid = await axios
      .get(
        `https://gatherer.wizards.com/Pages/Search/Default.aspx?name=+[${card.name}]`
      )
      .then(r => r.data.match(/multiverseid=(\d+)"/)[0].slice(13, -1));
    if (multiverseid) {
      card.imageUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${multiverseid}&type=card`;
    }
  }
  embed = new Discord.MessageEmbed()
    .setTitle(card.name + "\t" + convertText(card.manaCost))
    .addField(card.type, convertText(card.text))
    .addFields(
      { name: "Set", value: card.setName, inline: true },
      { name: "Rarity", value: card.rarity, inline: true },
      {
        name: card.loyalty ? "Loyalty" : "Power/Toughness",
        value: card.loyalty || `${card.power}/${card.toughness}`,
        inline: true,
      }
    );
  if (card.imageUrl) {
    embed.setImage(card.imageUrl);
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
              ? list +
                "❌ None of these\n(Too many results to show them all...) "
              : idx < emojisForMultipleCardResults.length
              ? list + `${discordEmojiForNumber(idx)} ${card.name}\n`
              : list,
          ""
        )
        .slice(0, -1)}`
    )
    .then(async pollMessage => {
      const filter = (reaction, user) =>
        (emojisForMultipleCardResults.includes(reaction.emoji.name) ||
          reaction.emoji.name === "❌") &&
        user.id !== pollMessage.author.id;
      const collector = pollMessage.createReactionCollector(filter, {
        max: 1,
        time: 1000 * 60 * 5,
      });
      //console.log(matchingCards.length);
      const doneReacting = Promise.all(
        matchingCards.map((x, idx) => {
          if (idx === emojisForMultipleCardResults.length + 1) {
            return pollMessage.react("❌");
          }
          const emoji = discordEmojiForNumber(idx);
          return emoji ? pollMessage.react(emoji) : Promise.resolve();
        })
      );

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
        .on("end", async r => {
          pollMessage.edit("Done!");
          await doneReacting;
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
