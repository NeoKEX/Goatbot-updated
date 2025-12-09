const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);
const API_ENDPOINT = "https://metakexbyneokex.fly.dev/animate";
const CACHE_DIR = path.join(__dirname, 'cache');

module.exports = {
  config: {
    name: "animate",
    aliases: ["anim", "video", "genvid"],
    version: "1.0",
    author: "Neoaz ゐ",
    countDown: 30,
    role: 0,
    longDescription: "Generate animated videos from text prompts using AI.",
    category: "ai",
    guide: {
      en: 
        "{pn} <prompt>\n\n" +
        "Example: {pn} a cat is swimming"
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return message.reply("Please provide a prompt to generate a video.");
    }

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    let tempFilePath;

    try {
      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}`;
      
      const apiResponse = await axios.get(fullApiUrl, { timeout: 120000 });
      const data = apiResponse.data;

      if (!data.success || !data.video_urls || data.video_urls.length === 0) {
        throw new Error(data.message || "API returned no video.");
      }

      const videoUrl = data.video_urls[0];

      const videoDownloadResponse = await axios.get(videoUrl, {
        responseType: 'stream',
        timeout: 120000,
      });
      
      const fileHash = Date.now() + Math.random().toString(36).substring(2, 8);
      tempFilePath = path.join(CACHE_DIR, `animate_${fileHash}.mp4`);
      
      await pipeline(videoDownloadResponse.data, fs.createWriteStream(tempFilePath));

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      
      await message.reply({
        body: "Video generated 🐦",
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      console.error("Animate Command Error:", error);
      message.reply("Failed to generate video.");

    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
};
