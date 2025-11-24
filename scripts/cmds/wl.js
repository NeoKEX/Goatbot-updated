const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "whitelist",
    aliases: ["wl"],
    version: "1.0",
    author: "NeoKEX",
    countDown: 5,
    role: 2,
    description: {
      en: "Add, remove, edit admin role"
    },
    category: "permission",
    guide: {
      en: '   {pn} [add | -a] <uid | @tag>: Add admin role for user' +
        '\n   {pn} [remove | -r] <uid | @tag>: Remove admin role of user' +
        '\n   {pn} [list | -l]: List all admins' +
        '\n   {pn} [enable | on]: Enable whitelist mode' +
        '\n   {pn} [disable | off]: Disable whitelist mode'
    }
  },

  langs: {
    en: {
      added: "✅ | Added whitelist role for %1 user(s):\n%2",
      alreadyAdmin: "⚠ | %1 user(s) already have whitelist role:\n%2",
      missingIdAdd: "⚠ | Please enter a user ID or tag someone to add.",
      removed: "✅ | Removed whitelist role from %1 user(s):\n%2",
      notAdmin: "⚠ | %1 user(s) don't have whitelist role:\n%2",
      missingIdRemove: "⚠ | Please enter a user ID or tag someone to remove.",
      listAdmin: "👑 | List of whitelisted users:\n%1",
      whiteListModeEnable: "✅ | Whitelist mode has been enabled.",
      whiteListModeDisable: "✅ | Whitelist mode has been disabled.",
      noPermission: "❗ Only developer can use this feature."
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang, role }) {
    switch (args[0]) {
      case "add":
      case "-a": {
        if (role < 3) return message.reply(getLang("noPermission"));
        let uids = [];

        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else if (event.messageReply)
          uids.push(event.messageReply.senderID);
        else
          uids = args.slice(1).filter(arg => !isNaN(arg));

        if (uids.length === 0)
          return message.reply(getLang("missingIdAdd"));

        const notWhitelisted = [];
        const alreadyWhitelisted = [];

        for (const uid of uids) {
          if (config.whiteListMode.whiteListIds.includes(uid))
            alreadyWhitelisted.push(uid);
          else
            notWhitelisted.push(uid);
        }

        if (notWhitelisted.length > 0)
          config.whiteListMode.whiteListIds.push(...notWhitelisted);

        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const userNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => `• ${name} (${uid})`)));

        const addedNames = userNames.filter(name => notWhitelisted.includes(name.split("(")[1].replace(")", "")));
        const alreadyNames = userNames.filter(name => alreadyWhitelisted.includes(name.split("(")[1].replace(")", "")));

        return message.reply(
          (notWhitelisted.length > 0 ? getLang("added", notWhitelisted.length, addedNames.join("\n")) : "") +
          (alreadyWhitelisted.length > 0 ? "\n" + getLang("alreadyAdmin", alreadyWhitelisted.length, alreadyNames.join("\n")) : "")
        );
      }

      case "remove":
      case "-r": {
        if (role < 3) return message.reply(getLang("noPermission"));
        let uids = [];

        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else
          uids = args.slice(1).filter(arg => !isNaN(arg));

        if (uids.length === 0)
          return message.reply(getLang("missingIdRemove"));

        const notWhitelisted = [];
        const whitelisted = [];

        for (const uid of uids) {
          if (config.whiteListMode.whiteListIds.includes(uid))
            whitelisted.push(uid);
          else
            notWhitelisted.push(uid);
        }

        config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.filter(uid => !whitelisted.includes(uid));

        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const userNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => `• ${name} (${uid})`)));

        const removedNames = userNames.filter(name => whitelisted.includes(name.split("(")[1].replace(")", "")));
        const notFoundNames = userNames.filter(name => notWhitelisted.includes(name.split("(")[1].replace(")", "")));

        return message.reply(
          (whitelisted.length > 0 ? getLang("removed", whitelisted.length, removedNames.join("\n")) : "") +
          (notWhitelisted.length > 0 ? "\n" + getLang("notAdmin", notWhitelisted.length, notFoundNames.join("\n")) : "")
        );
      }

      case "list":
      case "-l": {
        if (config.whiteListMode.whiteListIds.length === 0)
          return message.reply("⚠ | No users are currently whitelisted.");

        const userNames = await Promise.all(config.whiteListMode.whiteListIds.map(uid => usersData.getName(uid).then(name => `• ${name} (${uid})`)));
        return message.reply(getLang("listAdmin", userNames.join("\n")));
      }

      case "enable":
      case "on": {
        if (role < 3) return message.reply(getLang("noPermission"));
        config.whiteListMode.enable = true;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("whiteListModeEnable"));
      }

      case "disable":
      case "off": {
        if (role < 3) return message.reply(getLang("noPermission"));
        config.whiteListMode.enable = false;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("whiteListModeDisable"));
      }

      default:
        return message.SyntaxError();
    }
  }
};