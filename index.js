var client = new (require("discord.js")).Client();
client.login(require("./configs.js").TOKEN).then(async () => {
  client.db = new (require("enmap"))({"name": "DB"});
  await client.db.defer;
  console.log(client.user.tag + " is ready!");
  client.db.ensure("DB", {
    "welcomers": []
  });
});
client.on("message", async message => {
  if (message.author.target && message.deletable) return message.delete();
  else if (message.author.id == client.user.id && client.user.coolDown && message.deletable && !message.content.startsWith("$")) return setTimeout(() => message.delete(), client.user.coolDown);
  else if (message.author.id != client.user.id | !message.content.startsWith("$")) return undefined;
  var command = message.content.slice(1).split(" ")[0];
  if (message.deletable && command) message.delete();
  var userID = message.content.split(" ")[1];
  var user = message.mentions.users.first() || client.users.get(userID);
  var guild = user ? client.guilds.find(guild => guild.members.find(m => m.user.id == user.id && m.voiceChannel)) : undefined;
  var time = userID ? require("ms")(message.content.split(" ").slice(1).join(" ")) : undefined;
  var voiceChannel = guild ? guild.channels.find(c => c.type == "voice" && c.members.find(m => m.user.id == user.id)) : undefined;
  switch (command) {
    case "vc":
      if (!user) return undefined;
      else return message.channel.send(`> ${user} -> ${voiceChannel && guild ? `${voiceChannel.guild.name} -> ${voiceChannel.name}` : `None.`}`);
      break;
    case "target":
      if (!user) return undefined;
      user["target"] = user.target ? false : true;
      break;
    case "timer":
      if (!time && !client.user.coolDown) return undefined;
      client.user["coolDown"] = client.user.coolDown ? false : time;
      break;
    case "welcomer":
      var roomID = message.content.split(" ")[1];
      var room = client.channels.get(roomID);
      var welcomeMessage = message.content.split(" ").slice(2).join(" ");
      if (!room || !welcomeMessage) return undefined;
      if (!roomID || roomID.toLowerCase() == "false") return client.db.set("DB", {});
      var welcome = {
        "welcomeMessage": welcomeMessage,
        "roomID": room.id
      };
      client.db.set("DB", welcome);
      break;
    case "c":
      var value = parseInt(message.content.split(" ")[1]);
      value = !value && !message.content.split(" ")[1] ? 100 : value;
      if (isNaN(value)) return undefined;
      (await message.channel.fetchMessages()).filter(m => m.author.id == client.user.id && m.deletable).array().slice(0, value + 1).map(m => m.delete());
      break;
    case "vo":
      var cID = message.content.split(" ")[1];
      var c = client.channels.get(cID);
      if (!c || c.type != "voice" || !c.joinable) return undefined;
      c.join();
      break;
    case "pl":
      var toPlaying = message.content.split(" ").slice(1).join(" ");
      if (!toPlaying || toPlaying.toLowerCase() == "false") return client.user.setActivity().then(() => clearInterval(client.interval));
      else if ((!toPlaying || toPlaying.toLowerCase() == "false") && client.interval) return clearInterval(client.interval);
      else if (toPlaying && client.interval) clearInterval(client.interval);
      client.time = Date.now();
      client.user.setPresence({
        "game": {
          "name": toPlaying,
          "timestamps": {
            "start": client.time
          }
        }
      });
      client.interval = setInterval(() => {
        client.time += 2000 * 10;
        client.user.setPresence({
          "game": {
            "name": toPlaying,
            "timestamps": {
              "start": client.time
            }
          }
        });
      }, 10000);
      break;
    case "pltime":
      var time = message.content.split(" ")[1] ? require("ms")(message.content.split(" ").slice(1).join(" ")) : undefined;
      if (!time) return undefined;
      else client.time = Date.now() - time;
      break;
    case "cmds":
      message.channel.send(`\`\`\`css\n<---------------------------------------->\n$cmds - Display this list,\n$pl <something to play> - start playing something!,\n$pltime <time like 5h> - change the time of playing,\n$vo <channelID> - join voiceChannel by id,\n$c [size] - delete [size] messages of yourself,\n$welcomer <channelID> <welcome message>,\n$target <userID || userMention> - target user by delete any messages by him,\n$vc <userID || userMention> - get a voice channel of user by id,\n$timer <time like 10s> - coolDown delete all messages by yourself in <time>\n<---------------------------------------->\`\`\``);
      break;
  }
}).on("guildMemberAdd", member => {
  var welcome = {
    "message": client.db.get("DB").welcomeMessage,
    "roomID": client.db.get("DB").roomID
  }, channel = member.guild.channels.get(welcome.roomID);
  if (member.guild.channels.find(c => c.id == welcome.roomID) && channel) return setTimeout(() => channel.send(welcome.message), 20000);
});