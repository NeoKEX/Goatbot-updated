const axios = require("axios");
const nix = "http://65.109.80.126:20409/aryan/promptv2";

module.exports = {
  config: {
    name: "prompt",
    aliases: ["p"],
    version: "0.0.1",
    role: 0,
    author: "ArYAN",
    category: "ai",
    cooldowns: 5,
    guide: { en: "Reply to an image to generate Midjourney prompt" }
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, messageReply } = event;

    if (
      !messageReply ||
      !messageReply.attachments ||
      messageReply.attachments.length === 0 ||
      !messageReply.attachments[0].url
    ) {
      return api.sendMessage("Please reply to an image.", threadID, messageID);
    }

    try {
      api.setMessageReaction("⏰", messageID, () => {}, true);

      const imageUrl = messageReply.attachments[0].url;

      const apiResponse = await axios.get(nix, {
        params: { imageUrl }
      });

      const result = apiResponse.data;

      if (!result.success) {
        throw new Error(result.message || "Prompt API failed.");
      }

      const promptText = result.prompt || "No prompt returned.";

      await api.sendMessage(
        { body: `${promptText}` },
        threadID,
        messageID
      );

      api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);

      let msg = "Error while generating prompt.";
      if (e.response?.data?.error) msg = e.response.data.error;
      else if (e.message) msg = e.message;

      api.sendMessage(msg, threadID, messageID);
    }
  }
};