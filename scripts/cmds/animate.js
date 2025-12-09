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
    author: "NeoKEX",
    countDown: 30,
    role: 0,
    longDescription: "Generate animated videos from text prompts using AI.",
    category: "ai",
    guide: {
      en: 
        "{pn} <prompt>\n\n" +
        "• Example: {pn} a cat is swimming\n" +
        "• Example: {pn} a dog running in the park"
    }
  },

  onStart: async function ({ args, message, event }) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return message.reply("❌ Please provide a prompt to generate a video.\n\nExample: animate a cat is swimming");
    }

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    message.reaction("⏳", event.messageID);
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

      message.reaction("✅", event.messageID);
      
      await message.reply({
        body: `🎬 Video Generated!\n\n📝 Prompt: ${prompt}\n\n${data.credits || ""}`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "❌ Failed to generate video. An error occurred.";
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = `❌ Error 400: Invalid request or prompt.`;
        } else if (error.response.status === 429) {
          errorMessage = `❌ Rate limited. Please try again later.`;
        } else {
          errorMessage = `❌ HTTP Error ${error.response.status}. The API may be unavailable.`;
        }
      } else if (error.message.includes('timeout')) {
        errorMessage = `❌ Request timed out. Video generation may take too long.`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }

      console.error("Animate Command Error:", error);
      message.reply(errorMessage);

    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
};
