const axios = require("axios");

const baseUrl = "https://www.noobs-api.rf.gd";
const endpoint = "/dipto/ff-like";
const queryParam = "?uid=";

module.exports = {
  config: {
    name: "fflike",
    aliases: ["freefirelike", "ffl"],
    version: "2.2",
    author: "Mostakim",
    role: 0,
    premium: true,
    description: "Give Free Fire likes using API with smart progress animation",
    category: "game",
    guide: {
      en: "{p}fflike <uid>"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const uid = args[0];
      if (!uid)
        return api.sendMessage(
          "⚠️ Please provide a Free Fire UID.\nExample: fflike 1144528515",
          event.threadID,
          event.messageID
        );

      const startTime = Date.now();
      const waitMsg = await api.sendMessage(
        "⏳ Processing your request... Please wait a few seconds.",
        event.threadID
      );

      let isDone = false;
      const progressSteps = [
        "⏳ Processing your request... 20% complete.",
        "🔄 Still working... 40% complete.",
        "⚙️ Almost there... 70% complete.",
        "✅ Finalizing... 100% complete!"
      ];

      (async () => {
        for (let i = 0; i < progressSteps.length; i++) {
          if (isDone) break;
          await new Promise((r) => setTimeout(r, 20000));
          if (!isDone) await api.editMessage(progressSteps[i], waitMsg.messageID);
        }
      })();

      const apiUrl = `${baseUrl}${endpoint}${queryParam}${uid}`;
      const res = await axios.get(apiUrl);
      isDone = true;

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      const data = res.data;

      if (data.Status !== "Success") {
        return api.editMessage(
          `❌ Failed to process after ${duration} seconds. Please try again later.`,
          waitMsg.messageID
        );
      }

      const msg = `
╭──〔 💥 𝗙𝗥𝗘𝗘 𝗙𝗜𝗥𝗘 𝗟𝗜𝗞𝗘 💥 〕
├ 👤 Nickname: ${data.PlayerNickname}
├ 🆔 UID: ${data.UID}
│
├ 👍 Likes Before: ${data.LikesBeforeProcess}
├ ❤️ Likes Given: ${data.LikesGiven}
├ 🔥 Likes After: ${data.LikesAfterProcess}
│
├ 📦 Total Accounts in DB: ${data.TotalAccountsInJSON}
├ ✅ Liked By Accounts: ${data.LikedByAccounts}
│
⏱️ Process Time: ${duration} seconds
╰───────────────────╯
`;

      await api.editMessage(msg, waitMsg.messageID);

    } catch (e) {
      api.sendMessage(`❌ Error: ${e.message}`, event.threadID, event.messageID);
    }
  }
};