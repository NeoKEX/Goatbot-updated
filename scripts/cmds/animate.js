const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream/promises");

const API_ENDPOINT = "https://metakexbyneokex.fly.dev/animate";

module.exports = {
  config: {
    name: "animate",
    aliases: ["anim", "genvid"],
    version: "1.0",
    author: "VincentSensei",
    countDown: 30,
    role: 0,
    shortDescription: { en: "Generate AI animated video from prompt" },
    longDescription: { en: "Generate animated videos from text prompts using AI." },
    category: "ai",
    guide: {
      en: "{pn} <prompt>\n\nExample: {pn} a cat is swimming"
    }
  },

  onStart: async function ({ args, message, event }) {
    const prompt = args.join(" ").trim();
    if (!prompt) return message.reply("❌ Please provide a prompt to generate a video.\n\nExample: animate a cat is swimming");

    message.reaction("⏳", event.messageID);

    const tmpFile = path.join(os.tmpdir(), `animate_${Date.now()}.mp4`);

    try {
      const apiResponse = await axios.get(`${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}`, {
        timeout: 120000
      });
      const data = apiResponse.data;

      if (!data.success || !data.video_urls || data.video_urls.length === 0) {
        throw new Error(data.message || "API returned no video.");
      }

      const videoUrl = data.video_urls[0];

      const videoRes = await axios.get(videoUrl, {
        responseType: "stream",
        timeout: 120000
      });

      await pipeline(videoRes.data, fs.createWriteStream(tmpFile));

      message.reaction("✅", event.messageID);

      await message.reply({
        body: `🎬 Video generated!\n📝 Prompt: ${prompt}`,
        attachment: fs.createReadStream(tmpFile)
      });

    } catch (error) {
      console.error("[Animate] Error:", error.message);
      message.reaction("❌", event.messageID);
      message.reply(`❌ Failed to generate video: ${error.message}`);
    } finally {
      fs.unlink(tmpFile).catch(() => {});
    }
  }
};
