const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://downloader.nkx.lol";

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music"],
    version: "1.1",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search and download YouTube audio" },
    longDescription: { en: "Search and download YouTube audio automatically without selection menu." },
    category: "media",
    guide: { en: "{pn} <song name>" }
  },

  onStart: async function ({ message, args, event, api }) {
    const query = args.join(" ");
    if (!query) return message.reply("Please provide a song name.");

    api.setMessageReaction("⏳", event.messageID);

    try {
      const searchRes = await axios.get(`${BASE_URL}/api/search/youtube`, {
        params: { q: query, limit: 5 },
        timeout: 25000
      });

      const results = searchRes.data?.results;
      if (!Array.isArray(results) || results.length === 0) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("No songs found for your query.");
      }

      const selectedVideo = results[0];
      const videoUrl = selectedVideo.url;

      const dlRes = await axios.get(`${BASE_URL}/api/download/youtube`, {
        params: { url: videoUrl },
        timeout: 30000,
        validateStatus: () => true
      });

      if (!dlRes.data?.success) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(
          dlRes.data?.message || "Unable to retrieve download link for this song."
        );
      }

      const info = dlRes.data.data;
      const audioUrl = info?.mp3;
      const title = info?.title || selectedVideo.title;

      if (!audioUrl) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("Unable to retrieve download link.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

      let fileBuffer = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const fileRes = await axios.get(audioUrl, {
            responseType: "arraybuffer",
            timeout: 60000,
            maxContentLength: 26214400,
            maxBodyLength: 26214400
          });

          if (fileRes.data && fileRes.data.byteLength > 0) {
            if (fileRes.data.byteLength > 26214400) {
              api.setMessageReaction("❌", event.messageID);
              return message.reply("Audio size exceeds Messenger's 25MB limit.");
            }
            fileBuffer = fileRes.data;
            break;
          }
        } catch (downloadErr) {
          if (attempt === 3) throw downloadErr;
          await new Promise((res) => setTimeout(res, 2000));
        }
      }

      if (!fileBuffer) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("Failed to download the audio file after multiple attempts.");
      }

      await fs.writeFile(filePath, Buffer.from(fileBuffer));

      await message.reply({
        body: title,
        attachment: fs.createReadStream(filePath)
      });

      api.setMessageReaction("✅", event.messageID);
      fs.remove(filePath).catch(() => {});
    } catch (e) {
      console.error("[SING COMMAND ERROR]:", e?.response?.data || e.message || e);
      api.setMessageReaction("❌", event.messageID);
      message.reply("An error occurred while processing the download.");
    }
  }
};
