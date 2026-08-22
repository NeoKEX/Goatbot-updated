const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "pend", "pe"],
    version: "4.0.0",
    author: "Toshiro Editz",
    countDown: 5,
    role: 1,
    shortDescription: "Show new pending groups & auto clean dead threads",
    longDescription: "Approve pending groups/users with auto-remove invalid threads and auto-refresh",
    category: "utility",
  },

  // Auto Clean Function
  filterValidThreads: async function (list, api) {
    const valid = [];
    for (const thread of list) {
      try {
        await api.getThreadInfo(thread.threadID);
        valid.push(thread);
      } catch (e) {
        console.log("[AUTO-CLEAN] Removed invalid thread:", thread.threadID);
      }
    }
    return valid;
  },

  fetchPendingList: async function(api, usersData, type) {
    let list = await api.getThreadList(200, null, ["PENDING"]) || [];
    list = await this.filterValidThreads(list, api);

    let filteredList = [];
    if (type.startsWith("u")) filteredList = list.filter(t => !t.isGroup);
    if (type.startsWith("t")) filteredList = list.filter(t => t.isGroup);
    if (type === "all") filteredList = list;

    return filteredList;
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, pending, messageID } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const input = event.body.trim().toLowerCase();

    // Cancel operation
    if (input === "c") {
      try {
        await api.unsendMessage(messageID);
        return api.sendMessage("❌ Operation canceled.", event.threadID);
      } catch {
        return;
      }
    }

    const indexes = input.split(/\s+/).map(Number);
    if (isNaN(indexes[0])) {
      return api.sendMessage("⚠ Invalid input! Use numbers only.", event.threadID);
    }

    let count = 0;
    for (const idx of indexes) {
      if (idx <= 0 || idx > pending.length) continue;
      const group = pending[idx - 1];

      try {
        await api.sendMessage(
          "🎉 Group Approved!\nUse " + global.GoatBot.config.prefix + "help to view commands.",
          group.threadID
        );
        await api.changeNickname(
          global.GoatBot.config.nickNameBot || "🌬️ Raven Ai ✨",
          group.threadID,
          api.getCurrentUserID()
        );
        count++;
      } catch {
        count++;
      }
    }

    for (const idx of indexes.sort((a,b)=>b-a)) {
      if (idx > 0 && idx <= pending.length) pending.splice(idx-1,1);
    }

    return api.sendMessage(`✅ Approved ${count} group(s).`, event.threadID);
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;

    if (!global.GoatBot.config.adminBot.includes(event.senderID)) {
      return api.sendMessage("❌ You do not have permission to use this command.", threadID);
    }

    const type = args[0]?.toLowerCase();
    if (!type) {
      return api.sendMessage(
        "📌 Usage: pending [user / thread / all]\nTry: pending thread",
        threadID
      );
    }

    try {
      let filteredList = await this.fetchPendingList(api, usersData, type);

      // Retry mechanism if no pending found
      if (filteredList.length === 0) {
        console.log("[RETRY] No pending found. Retrying in 5 seconds...");
        await new Promise(r => setTimeout(r, 5000));
        filteredList = await this.fetchPendingList(api, usersData, type);
      }

      if (filteredList.length === 0) {
        return api.sendMessage("✨ No new pending requests found.", threadID);
      }

      let msg = `╭─ ⭕ Pending ${type.charAt(0).toUpperCase() + type.slice(1)} List ⭕ ─╮\n`;
      let index = 1;
      for (const single of filteredList) {
        const name = single.name || (await usersData.getName(single.threadID)) || "Unknown";
        msg += `│ ✨ [${index}] • ${name}\n`;
        index++;
      }
      msg += "╰────────────────╯\n\n";
      msg += "👉 Reply with number(s) to approve.\n";
      msg += '❌ Reply "c" to cancel.';

      return api.sendMessage(
        msg,
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
      console.log("ERROR:", error);
      return api.sendMessage("⚠ Unable to fetch pending list.", threadID);
    }
  }
};
