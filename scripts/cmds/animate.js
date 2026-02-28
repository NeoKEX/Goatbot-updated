const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);
const API_ENDPOINT = "https://metabyneokex.vercel.app/videos/generate";
const CACHE_DIR = path.join(__dirname, 'cache');

module.exports = {
  config: {
    name: "animate",
    aliases: ["anim", "video", "genvid"],
    version: "1.2",
    author: "Neoaz ゐ",
    countDown: 30,
    role: 0,
    longDescription: "Generate animated videos from text prompts.",
    category: "ai",
    guide: {
      en: "{pn} <prompt>\n\nExample: {pn} a beautiful sunset"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return message.reply("Please provide a prompt.");
    }

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    let tempFilePath;

    try {
      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}&orientation=VERTICAL`;
      
      const apiResponse = await axios.get(fullApiUrl, { timeout: 150000 });
      const data = apiResponse.data;

      const urls = data.image_urls || data.video_urls;

      if (!data.success || !urls || urls.length === 0) {
        throw new Error("Failed");
      }

      const videoUrl = urls[0];
      const fileHash = Date.now() + Math.random().toString(36).substring(2, 8);
      tempFilePath = path.join(CACHE_DIR, `animate_${fileHash}.mp4`);
      
      const downloadResponse = await axios.get(videoUrl, {
        responseType: 'stream',
        timeout: 120000,
      });
      
      await pipeline(downloadResponse.data, fs.createWriteStream(tempFilePath));

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      
      await message.reply({
        body: "Video generated 🎬",
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("Failed to generate video.");
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (err) {}
      }
    }
  }
};
