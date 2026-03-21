const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    aliases: ["fedit", "deepfake"],
    version: "1.0",
    author: "Neoaz 🐊",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Edit images using AI" },
    longDescription: { en: "Edit an image by replying to it with a prompt." },
    category: "image",
    guide: { en: "{pn} <prompt> (reply to an image)" }
  },

  onStart: async function ({ message, args, event, api }) {
    const { type, messageReply } = event;
    const prompt = args.join(" ");

    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
      return message.reply("Please reply to an image to edit it.");
    }

    if (!prompt) {
      return message.reply("Please provide a prompt to tell the AI how to edit the image.");
    }

    const imageUrl = messageReply.attachments[0].url;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const imgPath = path.join(cacheDir, `edit_${Date.now()}.png`);

    api.setMessageReaction("⏳", event.messageID);

    try {
      const apiUrl = `https://smfahim.xyz/ai/deepfake/gen?prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`;
      const response = await axios.get(apiUrl);
      const { success, generate_url } = response.data;

      if (!success || !generate_url) {
        throw new Error("AI editing failed.");
      }

      const imgRes = await axios.get(generate_url, { responseType: "arraybuffer" });
      await fs.writeFile(imgPath, Buffer.from(imgRes.data));

      await message.reply({ attachment: fs.createReadStream(imgPath) });
      
      api.setMessageReaction("✅", event.messageID);

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", event.messageID);
      message.reply(`❌ Error: ${error.message}`);
    } finally {
      if (await fs.pathExists(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
};
