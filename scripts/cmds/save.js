const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const owners = ["61588057525081"];
const apiBase = "https://neoaz.is-a.dev/api/paste";

module.exports = {
  config: {
    name: "savetext",
    aliases: ["save", "paste"],
    version: "3.4",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Save text or file code" },
    category: "owner",
    guide: { en: "{pn} <text> or reply to a message. Owners: {pn} <filename.js>" }
  },

  onStart: async function ({ message, event, api, args }) {
    let content = "";
    let fileName = "text.txt";
    const isOwner = owners.includes(event.senderID);

    try {
      if (event.type === "message_reply") {
        content = event.messageReply.body;
        if (args[0]) fileName = args[0].endsWith(".js") ? args[0] : args[0] + ".js";
      } else if (args.length > 0) {
        if (isOwner && (args[0].endsWith(".js") || args[0].includes("."))) {
          const filePath = path.join(__dirname, args[0]);
          if (!fs.existsSync(filePath)) return message.reply(`File "${args[0]}" not found.`);
          content = fs.readFileSync(filePath, "utf8");
          fileName = args[0];
        } else {
          content = args.join(" ");
        }
      }

      if (!content) return message.reply("Provide text or reply to a message.");

      api.setMessageReaction("⏳", event.messageID);

      const res = await axios.post(apiBase, {
        text: content,
        name: fileName
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const responseData = res.data;
      const finalUrl = typeof responseData === 'string' ? responseData : (responseData.url || JSON.stringify(responseData));

      message.reply(finalUrl);
      api.setMessageReaction("✅", event.messageID);

    } catch (error) {
      api.setMessageReaction("❌", event.messageID);
      const errorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      message.reply(`Error: ${errorDetail}`);
    }
  }
};
