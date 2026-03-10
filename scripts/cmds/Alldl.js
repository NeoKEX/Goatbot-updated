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
    const domain = getMainDomain(url);
    const platform = supportedDomains.find(d => d.domain === domain)?.name || "Media";

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
  }
};
