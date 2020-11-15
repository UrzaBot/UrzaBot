
async function pingAndy(msg){
  const { channel, author, content } = msg;
  console.log(msg);
  if (author.bot) return;
  const isTestMessage = content.match(/!andy/ig);
  if(isTestMessage) channel.send("You have been summoned, <@!105499268948709376>!");
}

module.exports = pingAndy;