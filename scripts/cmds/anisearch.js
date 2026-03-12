const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream/promises");

async function fetchAnimeVideos(query) {
  try {
    const response = await axios.get(`https://lyric-search-neon.vercel.app/kshitiz?keyword=${encodeURIComponent(query)}`, {
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    console.error("[AniSearch] Fetch error:", error.message);
    return null;
  }
}

module.exports = {
  config: {
    name: "anisearch",
    aliases: [],
    version: "1.0",
    author: "VincentSensei",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Get random anime edit video" },
    longDescription: { en: "Search for anime edit videos from TikTok" },
    category: "media",
    guide: { en: "{pn} [query]" }
  },

  onStart: async function ({ message, event, args }) {
    const query = args.join(" ");
    if (!query) return message.reply("❗ Please provide a search query. Example: anisearch naruto");

    try {
      message.reaction("⏳", event.messageID);

      const modifiedQuery = `${query} anime edit`;
      const videos = await fetchAnimeVideos(modifiedQuery);

      if (!videos || videos.length === 0) {
        message.reaction("❌", event.messageID);
        return message.reply(`❌ No anime edit videos found for "${query}".`);
      }

      const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
      const videoUrl = selectedVideo?.videoUrl;

      if (!videoUrl) {
        message.reaction("❌", event.messageID);
        return message.reply("❌ Error: No video URL found.");
      }

      const tmpFile = path.join(os.tmpdir(), `anisearch_${Date.now()}.mp4`);

      const response = await axios.get(videoUrl, {
        responseType: "stream",
        timeout: 120000
      });

      await pipeline(response.data, fs.createWriteStream(tmpFile));

      message.reaction("✅", event.messageID);

      await message.reply({
        body: `🎌 Anime Edit: ${query}`,
        attachment: fs.createReadStream(tmpFile)
      });

      fs.unlink(tmpFile).catch(() => {});

    } catch (error) {
      console.error("[AniSearch] Error:", error.message);
      message.reaction("❌", event.messageID);
      message.reply("❌ An error occurred while processing the video. Please try again later.");
    }
  }
};
