const axios = require("axios");

module.exports = {
  config: {
    name: "fluxkontextpro",
    aliases: ["kontextpro", "fkp"],
    version: "1.0",
    author: "NeoKEX",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Generate AI image with Flux Kontext Pro" },
    longDescription: { en: "Generate images using Flux Kontext Pro AI model" },
    category: "image",
    guide: {
      en: "{pn} <prompt>\nOr reply to an image with: {pn} <prompt>"
    }
  },

  onStart: async function ({ message, event, api, args }) {
    const hasPrompt = args.length > 0;
    const hasPhotoReply = event.type === "message_reply" && event.messageReply?.attachments?.[0]?.type === "photo";

    if (!hasPrompt && !hasPhotoReply) {
      return message.reply("❌ Please provide a prompt or reply to an image.");
    }

    const prompt = args.join(" ").trim();
    const model = "flux kontext pro";

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const imageUrl = hasPhotoReply ? event.messageReply.attachments[0].url : undefined;

      const res = await axios.get("https://fluxcdibai-1.onrender.com/generate", {
        params: {
          prompt,
          model,
          ...(imageUrl ? { imageUrl } : {})
        },
        timeout: 120000
      });

      const data = res.data;
      const resultUrl = data?.data?.imageResponseVo?.url;

      if (!resultUrl) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("❌ Failed to generate image.");
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        body: `🎨 ${model}`,
        attachment: await global.utils.getStreamFromURL(resultUrl)
      });

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Error while generating image.");
    }
  }
};
