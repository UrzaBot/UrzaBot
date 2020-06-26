const mtg = require("mtgsdk");
const Discord = require("discord.js");
const axios = require("axios");

function replyWithCardImage(msg) {
  const { content, author } = msg;
  if (author.bot) return;
  const cardInserts = content.match(/{(.+?)}/g);
  if (!cardInserts) return;
  let loadingMessage;
  msg
    .reply(`Loading card info on ${cardInserts.map(x => titleCase(x) + " ")}`)
    .then(lm => (loadingMessage = lm));
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
              // if (current.imageUrl) {
              //   list[foundIndex] = current;
              // }
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
          if (loadingMessage) {
            loadingMessage.delete();
            loadingMessage = null;
          }
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
    "W/B": "<:manawb:724502415922954270>",
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
  text && text.replace(/{(.+?)}/g, matcher);
  return text;
}

async function generateEmbed(
  card,
  isFlipCard,
  otherName,
  allowFlipping = true
) {
  const flipSymbol = "↪️";
  let embed;
  if (!card.imageUrl) {
    const multiverseid = await axios
      .get(
        `https://gatherer.wizards.com/Pages/Search/Default.aspx?name=+[${card.name}]`
      )
      .then(r => {
        const matches = r.data.match(/multiverseid=(\d+)"/);
        return matches ? matches[0].slice(13, -1) : null;
      });
    if (multiverseid) {
      card.imageUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${multiverseid}&type=card`;
    }
  }
  let colors = card.colors;
  const isLand = card.types.includes("Land");
  const monoColor = colors.length === 1;
  if (monoColor && colors.includes("White")) {
    colors[0] = "#fefefe";
  }
  const colorless = colors.length === 0;
  embed = new Discord.MessageEmbed()
    .setTitle(
      `${card.name}${card.manaCost ? "\t" + convertText(card.manaCost) : ""}`
    )
    .setColor(
      isLand
        ? "#654321"
        : colorless
        ? "DARKER_GREY"
        : monoColor
        ? colors[0].toUpperCase()
        : "GOLD"
    )
    .setDescription(card.type);
  if (card.text) {
    embed.addField("Text", convertText(card.text));
  }
  embed.addFields(
    //{ name: "Set", value: card.setName, inline: true },
    { name: "Rarity", value: card.rarity, inline: true }
  );
  if (card.power || card.loyalty) {
    embed.addFields({
      name: card.loyalty ? "Loyalty" : "Power/Toughness",
      value: card.loyalty || `${card.power}/${card.toughness}`,
      inline: true,
    });
  }
  if (isFlipCard) {
    embed.addFields({
      name: "Modal Card",
      value: allowFlipping
        ? `React with ${flipSymbol} to switch to ${otherName}`
        : `Switches to ${otherName}`,
      inline: true,
    });
  }
  if (card.imageUrl) {
    embed.setThumbnail(card.imageUrl);
  }
  return embed;
}

async function sendEmbed(msg, card) {
  const flipSymbol = "↪️";
  const isFlipCard = card.names && card.names.length > 1;
  const otherName = isFlipCard && card.names.filter(n => n !== card.name)[0];

  const originalEmbed = await generateEmbed(card, isFlipCard, otherName);
  msg.channel.send(originalEmbed).then(embedMsg => {
    if (!isFlipCard) return;
    embedMsg.react(flipSymbol);
    const filter = (reaction, user) =>
      reaction.emoji.name === flipSymbol && user.id !== embedMsg.author.id;
    const collector = embedMsg.createReactionCollector(filter, {
      time: 1000 * 60 * 5,
    });
    let flipCount = 0;
    let flippedCard;
    let flippedEmbed;
    collector.on("collect", async (r, user) => {
      if (flipCount !== 0) {
        r.users.remove(user.id);
        flipCount++;
        return embedMsg.edit(
          flipCount % 2 === 1 ? flippedEmbed : originalEmbed
        );
      }
      r.remove();
      const loadingEmbed = new Discord.MessageEmbed()
        .setTitle(otherName)
        .addField("Status", "Loading card info...");
      embedMsg.edit(loadingEmbed);
      await mtg.card
        .where({ name: otherName })
        .then(cards =>
          cards
            .reduce((list, current) => {
              const foundIndex = list.findIndex(n => n.name === current.name);
              if (foundIndex === -1) {
                return list.concat(current);
              }
              return list;
            }, [])
            .filter(card => card.name.toLowerCase() === otherName.toLowerCase())
        )
        .then(async ([card]) => {
          flippedCard = card;
          flipCount++;
          const isFlipCard = true;
          const otherName =
            isFlipCard && card.names.filter(n => n !== card.name)[0];
          flippedEmbed = await generateEmbed(card, isFlipCard, otherName, true);
          embedMsg.edit(flippedEmbed);
          await embedMsg.react(flipSymbol);
        });
    });
    collector.on("end", async () => {
      await embedMsg.reactions.removeAll();
      await embedMsg.edit(
        await generateEmbed(flippedCard, true, card.name, false)
      );
    });
  });
}

function pollForCorrectCard(name, msg, matchingCards) {
  const xMark = "❌";
  return msg.channel
    .send(
      `I found several cards matching ${name}. Which did you mean?\n${matchingCards
        .reduce(
          (list, card, idx, { length }) =>
            idx < emojisForMultipleCardResults.length
              ? list +
                `${discordEmojiForNumber(idx)} ${card.name}\n${
                  idx === length - 1 ? "❌ (None of these)" : ""
                }`
              : list,
          ""
        )
        .concat(
          matchingCards.length > emojisForMultipleCardResults.length
            ? "\nToo many results to show them all..."
            : ""
        )}`
    )
    .then(async pollMessage => {
      const filter = (reaction, user) =>
        (emojisForMultipleCardResults.includes(reaction.emoji.name) ||
          reaction.emoji.name === xMark) &&
        user.id !== pollMessage.author.id;
      const collector = pollMessage.createReactionCollector(filter, {
        max: 1,
        time: 1000 * 60 * 5,
      });
      const emojis = matchingCards
        .map((x, idx) => {
          if (idx === emojisForMultipleCardResults.length + 1) return xMark;
          return discordEmojiForNumber(idx) || null;
        })
        .filter(x => x)
        .concat([xMark]);
      const pollReactions = emojis.map(emoji => pollMessage.react(emoji));
      const doneReacting = Promise.all(pollReactions);

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
