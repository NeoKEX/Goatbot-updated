const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://play.nkx.lol";
const MAX_ATTACHMENT_BYTES = 26214400;
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const REQUEST_HEADERS = { "User-Agent": BROWSER_UA };

function resolveUrl(uri, baseUrl) {
  try {
    return new URL(uri, baseUrl).href;
  } catch (e) {
    return uri;
  }
}

function parseMediaPlaylist(text, baseUrl) {
  let initUrl = null;
  const segments = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#EXT-X-MAP:")) {
      const m = line.match(/URI="([^"]+)"/);
      if (m) initUrl = resolveUrl(m[1], baseUrl);
    } else if (!line.startsWith("#")) {
      segments.push(resolveUrl(line, baseUrl));
    }
  }

  return { initUrl, segments };
}
async function fetchAndParsePlaylist(url) {
  const res = await axios.get(url, { headers: REQUEST_HEADERS, timeout: 20000, responseType: "text" });
  const text = typeof res.data === "string" ? res.data : String(res.data);

  if (text.includes("#EXT-X-STREAM-INF")) {
    const variantLine = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#"));
    if (!variantLine) throw new Error("Master playlist had no variant stream.");
    return fetchAndParsePlaylist(resolveUrl(variantLine, url));
  }

  return parseMediaPlaylist(text, url);
}

async function downloadHlsAudio(streamUrl) {
  const { initUrl, segments } = await fetchAndParsePlaylist(streamUrl);
  if (segments.length === 0) throw new Error("No segments were found in the HLS playlist.");

  const buffers = [];
  let totalBytes = 0;

  if (initUrl) {
    const initRes = await axios.get(initUrl, { headers: REQUEST_HEADERS, responseType: "arraybuffer", timeout: 20000 });
    buffers.push(Buffer.from(initRes.data));
    totalBytes += initRes.data.byteLength;
  }

  for (const segUrl of segments) {
    const segRes = await axios.get(segUrl, { headers: REQUEST_HEADERS, responseType: "arraybuffer", timeout: 20000 });
    totalBytes += segRes.data.byteLength;
    if (totalBytes > MAX_ATTACHMENT_BYTES) {
      throw new Error("Audio stream exceeds Messenger's 25MB limit.");
    }
    buffers.push(Buffer.from(segRes.data));
  }

  return { buffer: Buffer.concat(buffers), isFragmentedMp4: !!initUrl };
}

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music"],
    version: "1.1",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search and download a song" },
    longDescription: { en: "Search and download the top matching song automatically." },
    category: "media",
    guide: { en: "{pn} <song name>" }
  },

  onStart: async function ({ message, args, event, api }) {
    const query = args.join(" ");
    if (!query) return message.reply("Please provide a song name.");

    api.setMessageReaction("⏳", event.messageID);

    try {
      const searchRes = await axios.get(`${BASE_URL}/search`, {
        params: { q: query, limit: 1 },
        timeout: 25000,
        validateStatus: () => true
      });

      if (searchRes.status >= 400) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(`Search failed (status ${searchRes.status}).`);
      }

      const results = searchRes.data?.results;
      if (!Array.isArray(results) || results.length === 0) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("No songs found for your query.");
      }

      const selected = results[0];
      const streamUrl = selected.audio_cdn_url;
      const title = selected.title || query;

      if (!streamUrl) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("No playable stream was found for that result.");
      }

      const { buffer, isFragmentedMp4 } = await downloadHlsAudio(streamUrl);
      if (buffer.length === 0) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("The downloaded audio was empty.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const ext = isFragmentedMp4 ? "m4a" : "aac";
      const filePath = path.join(cacheDir, `${Date.now()}.${ext}`);
      await fs.writeFile(filePath, buffer);

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
