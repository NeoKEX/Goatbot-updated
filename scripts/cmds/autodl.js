const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream/promises");

const API_URL = "https://smfahim.xyz/download/all/v15";

const supportedDomains = [
  { domain: "facebook.com", name: "Facebook" },
  { domain: "fb.watch", name: "Facebook" },
  { domain: "instagram.com", name: "Instagram" },
  { domain: "tiktok.com", name: "TikTok" },
  { domain: "youtube.com", name: "YouTube" },
  { domain: "youtu.be", name: "YouTube" },
  { domain: "twitter.com", name: "Twitter" },
  { domain: "x.com", name: "Twitter" },
  { domain: "pinterest.com", name: "Pinterest" }
];

function getMainDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === "youtu.be") return "youtube.com";
    const parts = hostname.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
  } catch {
    return null;
  }
}

function getExtFromContentType(ct) {
  if (!ct) return null;
  ct = ct.toLowerCase();
  if (ct.includes("video/mp4")) return ".mp4";
  if (ct.includes("video/")) return ".mp4";
  if (ct.includes("audio/mpeg") || ct.includes("audio/mp3")) return ".mp3";
  if (ct.includes("audio/")) return ".mp3";
  if (ct.includes("image/jpeg") || ct.includes("image/jpg")) return ".jpg";
  if (ct.includes("image/png")) return ".png";
  if (ct.includes("image/")) return ".jpg";
  return ".mp4";
}

async function downloadMedia({ url, message, event }) {
  try {
    message.reaction("⏳", event.messageID);

    const domain = getMainDomain(url);
    const platform = supportedDomains.find(d => d.domain === domain)?.name || "Media";

    // --- YOUTUBE SPECIFIC OVERRIDE ---
    if (platform === "YouTube") {
      const ytSearch = require("yt-search");
      
      let videoId;
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === "youtu.be") {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes("youtube.com")) {
          const urlParams = new URLSearchParams(urlObj.search);
          videoId = urlParams.get("v");
          if (!videoId) {
            const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
            if (shortsMatch) videoId = shortsMatch[1];
          }
        }
      } catch {}

      if (!videoId) {
        message.reaction("❌", event.messageID);
        return message.reply("❌ Invalid YouTube URL format.");
      }

      const searchResults = await ytSearch(videoId);
      if (!searchResults || !searchResults.videos.length) {
        message.reaction("❌", event.messageID);
        return message.reply("❌ No YouTube results found.");
      }
      
      const topResult = searchResults.videos[0];
      const API_URL_NIX = "https://api.nixhost.top/aryan/yx";
      const cleanVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const apiUrl = `${API_URL_NIX}?url=${encodeURIComponent(cleanVideoUrl)}&type=mp4`;

      const downloadResponse = await axios.get(apiUrl, { timeout: 30000 });
      const data = downloadResponse.data;

      if (!data || !data.download_url) {
        message.reaction("❌", event.messageID);
        return message.reply("❌ Failed to get YouTube download link.");
      }

      const download_url = data.download_url;
      const tmpFile = path.join(os.tmpdir(), `autodl_yt_${Date.now()}.mp4`);
      
      const fileResponse = await axios.get(download_url, {
        responseType: "stream",
        timeout: 120000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://www.youtube.com/"
        }
      });

      await pipeline(fileResponse.data, fs.createWriteStream(tmpFile));
      message.reaction("✅", event.messageID);

      const bodyMessage = `🎬 𝐘𝐎𝐔𝐓𝐔𝐁𝐄 𝐀𝐔𝐓𝐎-𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃\n\n━━━━━━━━━━━━━━━\n📌 Title: ${topResult.title}\n📺 Channel: ${topResult.author.name}\n⏱️ Duration: ${topResult.timestamp}\n━━━━━━━━━━━━━━━\n\n💾 Type "dl" or "download" to get the raw stream link.`;

      const sentMessage = await message.reply({
        body: bodyMessage,
        attachment: fs.createReadStream(tmpFile)
      });

      fs.unlink(tmpFile).catch(() => {});

      // Register the reply event for 'dl' just like ytdl.js
      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: "autodl",
        messageID: sentMessage.messageID,
        author: event.senderID,
        downloadUrl: download_url
      });

      return; // End early, YouTube handled exclusively
    }
    // --- END YOUTUBE OVERRIDE ---

    // GENERIC OTHER MEDIA DOWNLOAD (TikTok, FB, etc)
    const res = await axios.get(`${API_URL}?url=${encodeURIComponent(url)}`, {
      timeout: 60000
    });

    const data = res.data;
    console.log("[AutoDL] API Response:", JSON.stringify(data));

    if (!data) {
      message.reaction("❌", event.messageID);
      await message.reply("❌ Empty response from API.");
      return;
    }

    // Try to find download URL from various possible response fields
    let downloadUrl = 
      data?.url || 
      data?.downloadUrl || 
      data?.download_url || 
      data?.video_url || 
      data?.media_url || 
      data?.link || 
      data?.data?.url ||
      data?.data?.downloadUrl ||
      data?.data?.download_url ||
      data?.links?.hd ||
      data?.links?.sd ||
      data?.links?.mp3 ||
      data?.result?.url ||
      data?.response?.url;

    // If still no URL, try to find any URL-like string in the response
    if (!downloadUrl) {
      const responseStr = JSON.stringify(data);
      const urlMatch = responseStr.match(/https?:\/\/[^\s"']+\.(mp4|mp3|jpg|jpeg|png|webm|m4a)[^\s"']*/i);
      if (urlMatch) {
        downloadUrl = urlMatch[0];
      }
    }

    if (!downloadUrl) {
      message.reaction("❌", event.messageID);
      await message.reply("❌ No download URL found in the response.");
      return;
    }

    const title = data?.title || data?.filename || "Media Download";

    const resp = await axios.get(downloadUrl, {
      responseType: "stream",
      timeout: 120000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Referer": downloadUrl
      },
      maxRedirects: 5,
      validateStatus: s => s >= 200 && s < 400
    });

    const stream = resp.data;
    const contentType = resp.headers["content-type"];
    const urlExt = (() => {
      try {
        return path.extname(new URL(downloadUrl).pathname);
      } catch {
        return "";
      }
    })();
    const ext = getExtFromContentType(contentType) || urlExt || ".mp4";
    const tmpFile = path.join(os.tmpdir(), `autodl_${Date.now()}${ext}`);

    await pipeline(stream, fs.createWriteStream(tmpFile));

    message.reaction("✅", event.messageID);

    try {
      let bodyMessage = `📥 ${platform} 𝐀𝐔𝐓𝐎-𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃\n\n`;
      bodyMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
      bodyMessage += `📝 ${title}\n`;
      bodyMessage += `━━━━━━━━━━━━━━━━━━━━`;

      await message.reply({
        body: bodyMessage,
        attachment: fs.createReadStream(tmpFile)
      });
    } finally {
      fs.unlink(tmpFile).catch(() => {});
    }

  } catch (error) {
    console.error("[AutoDL] Error:", error.message);
    message.reaction("❌", event.messageID);
    
    // Check if it was a YouTube API size error and supply the raw link like ytdl
    if (error.response?.status === 403 || error.response?.status === 404 || error.message.includes("size")) {
      try {
        const domain = getMainDomain(url);
        if (domain && domain.includes("youtube")) {
            await message.reply(`🎬 YouTube Video is too large to send directly! Try extracting the link using the ^ytdl command.`);
            return;
        }
      } catch {}
    }
    
    try {
      await message.reply("❌ Download failed. Please try again later.");
    } catch {}
  }
}

module.exports = {
  config: {
    name: "autodl",
    aliases: ["adl", "autodownload"],
    version: "1.0",
    author: "Neoaz ゐ",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Auto-download social media links" },
    longDescription: { en: "Automatically download Facebook, TikTok, Instagram, YouTube and other social media links" },
    category: "media",
    guide: {
      en: "{pn} on - Enable auto-download\n{pn} off - Disable auto-download"
    }
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    if (["on", "off"].includes(args[0])) {
      if (role < 1) return message.reply("❌ Access denied. Admin only.");
      const choice = args[0] === "on";
      const gcData = (await threadsData.get(event.threadID, "data")) || {};
      await threadsData.set(event.threadID, { data: { ...gcData, autoDownload: choice } });
      return message.reply(`📥 Auto-download: ${choice ? "✅ Enabled" : "❌ Disabled"}`);
    }

    let url = args.find(arg => /^https?:\/\//.test(arg));

    if (!url && event.type === "message_reply") {
      const replyBody = event.messageReply.body;
      const match = replyBody.match(/https?:\/\/[^\s]+/);
      if (match) url = match[0];
    }

    if (!url) {
      return message.reply(
        `📥 𝐀𝐔𝐓𝐎-𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Usage:\n` +
        `• {pn} on - Enable auto-download\n` +
        `• {pn} off - Disable auto-download\n` +
        `• {pn} <url> - Download now\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Supported: Facebook, TikTok, Instagram, YouTube, Twitter, Pinterest`
      );
    }

    const domain = getMainDomain(url);
    if (!supportedDomains.some(d => d.domain === domain)) {
      return message.reply("❌ Unsupported platform.");
    }

    message.reaction("⏳", event.messageID);
    await downloadMedia({ url, message, event });
  },

  onChat: async function ({ event, message, threadsData }) {
    if (event.senderID === global.botID || !event.body) return;

    const threadData = await threadsData.get(event.threadID);
    if (!threadData?.data?.autoDownload) return;

    const urlRegex = /https?:\/\/[^\s]+/;
    const match = event.body.match(urlRegex);

    if (match) {
      const url = match[0];
      const domain = getMainDomain(url);

      if (supportedDomains.some(d => d.domain === domain)) {
        const prefix = await global.utils.getPrefix(event.threadID);
        if (event.body.startsWith(prefix)) return;

        await downloadMedia({ url, message, event });
      }
    }
  },

  onReply: async function ({ api, message, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const { body } = event;
    const messageText = body.toLowerCase().trim();

    if (messageText === "dl" || messageText === "download") {
      let shortLink = Reply.downloadUrl;
      try {
        const shortApiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(Reply.downloadUrl)}`;
        const shortResponse = await axios.get(shortApiUrl, { timeout: 10000 });
        if (shortResponse.data && shortResponse.data.length < shortLink.length) {
          shortLink = shortResponse.data;
        }
      } catch (e) {
        console.log("[AutoDL] Could not shorten URL");
      }

      const downloadMessage = await message.reply(`📥 Download URL:\n${shortLink}`);
      
      // Unsend the download link after 50 seconds
      setTimeout(async () => {
        try {
          api.unsendMessage(downloadMessage.messageID);
        } catch (e) {}
      }, 50000);
    }
  }
};
