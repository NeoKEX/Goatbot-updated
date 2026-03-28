const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "approve",
    aliases: ["pending", "pend", "pe"],
    version: "2.0.0",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 2,
    shortDescription: "Handle pending requests",
    longDescription: "Approve or reject pending users or group requests with a clean UI.",
    category: "utility",
  },

  onReply: async function ({ message, api, event, Reply }) {
    const { author, pending, messageID } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const { body, threadID } = event;

    if (body.trim().toLowerCase() === "c") {
      api.unsendMessage(messageID);
      return message.reply("✕ Operation has been canceled!");
    }

    const indexes = body.split(/\s+/).map(Number);
    if (isNaN(indexes[0])) return message.reply("✕ Invalid input! Please provide valid numbers.");

    let count = 0;
    const prefix = global.GoatBot.config.prefix || "/";

    for (const idx of indexes) {
      if (idx <= 0 || idx > pending.length) continue;

      const target = pending[idx - 1];
      try {
        await api.sendMessage(
          `━━━━━━━━━━━━━━━━\n『 APPROVAL NOTICE 』\n━━━━━━━━━━━━━━━━\n\nYour request has been approved by the Admin!\n\nType ${prefix}help to see all available commands.\n\nEnjoy using the Bot!`,
          target.threadID
        );

        await api.changeNickname(
          `${global.GoatBot.config.nickNameBot || "Bot"}`,
          target.threadID,
          api.getCurrentUserID()
        );
        count++;
      } catch (err) {
        count++;
      }
    }

    return message.reply(`✓ [ SUCCESS ] Approved ${count} ${count > 1 ? "Entries" : "Entry"}!`);
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;
    const type = args[0]?.toLowerCase();

    if (!["user", "thread", "all"].some(t => type?.startsWith(t))) {
      return message.reply(`『 USAGE 』\n\n${this.config.name} user  — Approve users\n${this.config.name} thread — Approve groups\n${this.config.name} all    — Approve everything`);
    }

    try {
      const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
      const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
      const list = [...spam, ...pending];

      let filteredList = [];
      if (type.startsWith("u")) filteredList = list.filter((t) => !t.isGroup);
      else if (type.startsWith("t")) filteredList = list.filter((t) => t.isGroup);
      else filteredList = list;

      if (filteredList.length === 0) return message.reply("✕ No pending requests found in this category.");

      let msg = `━━━━━━━━━━━━━━━━\n『 PENDING REQUESTS 』\n━━━━━━━━━━━━━━━━\n\n`;

      for (let i = 0; i < filteredList.length; i++) {
        const name = filteredList[i].name || (await usersData.getName(filteredList[i].threadID)) || "Unknown User";
        msg += `[ ${i + 1} ] ${name}\n`;
      }

      msg += `\n━━━━━━━━━━━━━━━━\n➥ Reply with numbers (e.g., 1 2)\n➥ Reply "c" to Cancel.`;

      return api.sendMessage(msg, threadID, (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          pending: filteredList,
        });
      }, messageID);

    } catch (error) {
      return message.reply("✕ Failed to fetch the pending list.");
    }
  },
};
