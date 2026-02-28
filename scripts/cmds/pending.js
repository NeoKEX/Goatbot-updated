const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "approve",
    aliases: ["pen", "pend", "pe"],
    version: "1.6.9",
    author: "NeoKEX",
    countDown: 5,
    role: 0,
    shortDescription: "Handle pending requests",
    longDescription: "Approve or reject pending users or group requests",
    category: "utility",
  },

  onReply: async function ({ message, api, event, Reply }) {
    const { author, pending, messageID } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const { body, threadID } = event;

    if (body.trim().toLowerCase() === "c") {
      try {
        await api.unsendMessage(messageID);
        return api.sendMessage(
          `Operation has been canceled!`,
          threadID
        );
      } catch {
        return;
      }
    }

    const indexes = body.split(/\s+/).map(Number);

    if (isNaN(indexes[0])) {
      return api.sendMessage(`× Invalid input! Please try again.`, threadID);
    }

    let count = 0;

    for (const idx of indexes) {
 
      if (idx <= 0 || idx > pending.length) continue;

      const group = pending[idx - 1];
      const prefix = global.GoatBot.config.prefix || "/";

      try {
        await api.sendMessage(
          `✓ Group approved! Type ${prefix}help to see available commands.`,
          group.threadID
        );

        await api.changeNickname(
          `${global.GoatBot.config.nickNameBot || "Bot"}`,
          group.threadID,
          api.getCurrentUserID()
        );

        count++;
      } catch {
        count++;
      }
    }

    for (const idx of indexes.sort((a, b) => b - a)) {
      if (idx > 0 && idx <= pending.length) {
        pending.splice(idx - 1, 1);
      }
    }

    return api.sendMessage(
      `✓ [ Successfully ] Approved ${count} Groups!`,
      threadID
    );
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;

    const type = args[0]?.toLowerCase();
    if (!type) {
      return api.sendMessage(
        `Usage: approve [user/thread/all]`,
        threadID
      );
    }

    let msg = "",
      index = 1;
    try {
      const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
      const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
      const list = [...spam, ...pending];

      let filteredList = [];
      if (type.startsWith("u")) filteredList = list.filter((t) => !t.isGroup);
      if (type.startsWith("t")) filteredList = list.filter((t) => t.isGroup);
      if (type === "all") filteredList = list;

      for (const single of filteredList) {
        const name =
          single.name || (await usersData.getName(single.threadID)) || "Unknown";

        msg += `[ ${index} ]  ${name}\n`;
        index++;
      }

      msg += `✓ Reply with the correct group number to approve!\n`;
      msg += `× Reply with "c" to Cancel.\n`;

      return api.sendMessage(
        `[ Pending Groups & Users ${type
          .charAt(0)
          .toUpperCase()}${type.slice(1)} List ]\n\n${msg}`,
        threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            pending: filteredList,
          });
        },
        messageID
      );
    } catch (error) {
      return api.sendMessage(
        `× Failed to retrieve pending list. Please try again later.`,
        threadID
      );
    }
  },
};