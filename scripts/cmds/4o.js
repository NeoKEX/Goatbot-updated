const axios = require("axios");

module.exports = {
  config: {
    name: "4o",
    aliases: ["gpt4o", "dalle4o"],
    version: "1.0",
    author: "Neoaz ゐ", //API by RIFAT
    countDown: 10,
    role: 0,
    shortDescription: { en: "Generate AI image with 4o" },
    longDescription: { en: "Generate images using 4o AI model" },
    category: "image",
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ message, event, api, args }) {
    const hasPrompt = args.length > 0;

    if (!hasPrompt) {
      return message.reply("Please provide a prompt.");
    }

    const prompt = args.join(" ").trim();
    const model = "4o";

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const res = await axios.get("https://fluxcdibai-1.onrender.com/generate", {
        params: { prompt, model },
        timeout: 120000
      });

      const data = res.data;
      const resultUrl = data?.data?.imageResponseVo?.url;

      if (!resultUrl) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("Failed to generate image.");
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        body: "Image generated 🐦",
        attachment: await global.utils.getStreamFromURL(resultUrl)
      });

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("Error while generating image.");
    }
  }
};
