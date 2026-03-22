const axios = require("axios");

module.exports = {
  config: {
    name: "prompt",
    version: "1.0",
    author: "NeoKEX",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Get prompt from image" },
    longDescription: { en: "Extracts prompt from an image URL or replied image." },
    category: "ai",
    guide: { en: "{pn} [image url] or reply to an image" }
  },

  onStart: async function ({ message, args, event, api }) {
    let imageUrl = args[0];
    const { type, messageReply } = event;

    if (type === "message_reply" && messageReply.attachments?.[0]?.type === "photo") {
      imageUrl = messageReply.attachments[0].url;
    }

    if (!imageUrl) return message.reply("Please provide an image URL or reply to an image.");

    try {
      api.setMessageReaction("⏳", event.messageID);
      
      const res = await axios.get(`https://smfahim.xyz/ai/img2prompt/v3`, {
        params: {
          imageUrl: imageUrl,
          language: "en",
          model: "0"
        }
      });

      if (res.data.success && res.data.prompt) {
        message.reply(res.data.prompt);
        api.setMessageReaction("✅", event.messageID);
      } else {
        throw new Error();
      }

    } catch (err) {
      api.setMessageReaction("❌", event.messageID);
      message.reply("Failed to extract prompt from this image.");
    }
  }
};
