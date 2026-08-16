const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://nkx-downloader-pro.vercel.app";

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music"],
    version: "1.0",
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
      // 1) Search YouTube via our API
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

      // 2) Download audio for the top result via our API
      const dlRes = await axios.get(`${BASE_URL}/api/download/youtube`, {
        params: { url: videoUrl },
        timeout: 30000,
        validateStatus: () => true // handle 502 upstream failures ourselves below
      });

      if (!dlRes.data?.success) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(
          dlRes.data?.message || "Unable to retrieve download link for this song."
        );
      }

      const audioUrl = extractAudioUrl(dlRes.data.data);

      if (!audioUrl) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("Unable to retrieve download link.");
      }

      // 3) Fetch the actual audio file
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
        body: selectedVideo.title,
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

/**
 * The download endpoint wraps whatever btch-downloader's youtube() function
 * returns inside `data`, and that upstream shape isn't guaranteed to stay
 * consistent across versions. Try the field names it's most likely to use,
 * then fall back to scanning for any string that looks like an audio link.
 */
function extractAudioUrl(data) {
  if (!data || typeof data !== "object") return null;

  const directCandidates = [
    data.mp3,
    data.audio,
    data.audio_url,
    data.audioUrl,
    data.dl_url,
    data.download,
    data.download_url,
    data.downloadUrl,
    data.url,
    data.link,
    data.media?.mp3,
    data.media?.audio,
    data.result?.mp3,
    data.result?.audio,
    Array.isArray(data.urls) ? data.urls.find((u) => typeof u === "string" && u.includes(".mp3")) : null,
    Array.isArray(data.urls) ? data.urls[0] : null
  ];

  const direct = directCandidates.find((v) => typeof v === "string" && v.startsWith("http"));
  if (direct) return direct;

  // Last resort: recursively scan the object for any http(s) string that
  // looks like an audio file link.
  const found = deepFindAudioLink(data);
  return found || null;
}

function deepFindAudioLink(obj, depth = 0) {
  if (depth > 4 || !obj || typeof obj !== "object") return null;

  for (const value of Object.values(obj)) {
    if (typeof value === "string" && value.startsWith("http") && /\.mp3(\?|$)|audio/i.test(value)) {
      return value;
    }
    if (typeof value === "object" && value !== null) {
      const nested = deepFindAudioLink(value, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}
