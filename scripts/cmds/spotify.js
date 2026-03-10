const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream/promises");

const SPOTIFY_API = "https://spotify.zenithapi.qzz.io/spotify";

function isValidSpotifyUrl(url) {
  try {
    const spotifyDomains = ["open.spotify.com", "spotify.com"];
    const hostname = new URL(url).hostname;
    return spotifyDomains.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

function getExtFromContentType(ct) {
  if (!ct) return null;
  ct = ct.toLowerCase();
  if (ct.includes("audio/mpeg") || ct.includes("audio/mp3")) return ".mp3";
  if (ct.includes("audio/")) return ".mp3";
  return ".mp3";
}

async function downloadSpotify({ url, message, event }) {
  try {
    message.reaction("⏳", event.messageID);

    const res = await axios.get(SPOTIFY_API, {
      params: { url },
      timeout: 60000
    });

    const data = res.data;

    if (!data?.success) {
      message.reaction("❌", event.messageID);
      await message.reply("❌ Failed to fetch Spotify data. Please check the URL and try again.");
      return;
    }

    const downloadUrl = data?.download?.url;
    if (!downloadUrl) {
      message.reaction("❌", event.messageID);
      await message.reply("❌ No download URL found in the response.");
      return;
    }

    const title = data?.track?.name || "Spotify Download";
    const artist = data?.track?.artists || "Unknown Artist";
    const thumbnail = data?.track?.albumImage || "";
    const duration = data?.track?.duration || "";

    const resp = await axios.get(downloadUrl, {
      responseType: "stream",
      timeout: 120000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Referer": "https://spotify.com/"
      },
      maxRedirects: 5,
      validateStatus: s => s >= 200 && s < 400
    });

    const stream = resp.data;
    const contentType = resp.headers["content-type"];
    const ext = getExtFromContentType(contentType) || ".mp3";
    const tmpFile = path.join(os.tmpdir(), `spotify_${Date.now()}${ext}`);

    await pipeline(stream, fs.createWriteStream(tmpFile));

    message.reaction("✅", event.messageID);

    try {
      let bodyMessage = `🎵 𝐒𝐏𝐎𝐓𝐈𝐅𝐘 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃\n\n`;
      bodyMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
      bodyMessage += `🎤 ${artist}\n`;
      bodyMessage += `🎶 ${title}\n`;
      if (duration) bodyMessage += `⏱️ ${duration}\n`;
      bodyMessage += `━━━━━━━━━━━━━━━━━━━━`;

      await message.reply({
        body: bodyMessage,
        attachment: fs.createReadStream(tmpFile)
      });
    } finally {
      fs.unlink(tmpFile).catch(() => {});
    }

  } catch (error) {
    console.error("[Spotify Downloader] Error:", error.message);
    message.reaction("❌", event.messageID);
    try {
      await message.reply("❌ Download failed. Please try again later or check the Spotify URL.");
    } catch {}
  }
}

module.exports = {
  config: {
    name: "spotify",
    aliases: ["spdl", "spotifydl"],
    version: "1.0",
    author: "Neoaz ゐ",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Download Spotify tracks" },
    longDescription: { en: "Download music from Spotify using the Spotify downloader API" },
    category: "media",
    guide: {
      en: "{pn} <spotify_url>\n\nExample: {pn} https://open.spotify.com/track/..."
    }
  },

  onStart: async function ({ message, event, args }) {
    let url = args.find(arg => /^https?:\/\//.test(arg));

    if (!url && event.type === "message_reply") {
      const replyBody = event.messageReply.body;
      const match = replyBody.match(/https?:\/\/[^\s]+/);
      if (match) url = match[0];
    }

    if (!url) {
      return message.reply(
        `❌ Please provide a Spotify URL.\n\n` +
        `📝 Usage: {pn} spotify <spotify_url>\n\n` +
        `🎵 Supported:\n` +
        `• Spotify Track\n` +
        `• Spotify Album\n` +
        `• Spotify Playlist\n` +
        `• Spotify Artist`
      );
    }

    if (!isValidSpotifyUrl(url)) {
      return message.reply("❌ Invalid Spotify URL. Please provide a valid Spotify link.");
    }

    await downloadSpotify({ url, message, event });
  }
};
