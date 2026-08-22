const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CUSTOM_API_URL = "https://toshiro-api-editz6t9.vercel.app/api/downloader/alldl";

function detectPlatform(url) {
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("facebook.com") || url.includes("fb.watch")) return "Facebook";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("x.com") || url.includes("twitter.com")) return "Twitter / X";
  if (url.includes("pin.it") || url.includes("pinterest.com")) return "Pinterest";
  return "Unknown";
}

module.exports = {
  config: {
    name: "autodl",
    version: "4.3",
    author: "Toshiro Editz",
    role: 0,
    category: "media",
    description: {
      en: "Auto download videos from TikTok, Facebook, Instagram, YouTube, X/Twitter, Pinterest"
    },
    guide: { en: "[video_link]" }
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const text = event.body || "";

    const SUPPORTED = [
      "https://vt.tiktok.com",
      "https://www.tiktok.com/",
      "https://vm.tiktok.com",
      "https://www.facebook.com/share/v",
      "https://www.facebook.com/share/r",
      "https://www.instagram.com/",
      "https://youtu.be/",
      "https://youtube.com/",
      "https://x.com/",
      "https://twitter.com/",
      "https://pin.it/",
      "https://www.pinterest.com/"
    ];

    if (!SUPPORTED.some(link => text.startsWith(link))) return;

    api.setMessageReaction("🐤", event.messageID, () => {}, true);
    const startTime = Date.now();

    try {
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const filePath = path.join(cacheDir, `autodl_${Date.now()}.mp4`);

      const res = await axios.get(CUSTOM_API_URL + "?url=" + encodeURIComponent(text), {
        timeout: 20000
      });

      const response = res.data;

      if (!response.success) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          `❌ Failed: ${response.message || "Unknown error"}`,
          event.threadID,
          event.messageID
        );
      }

      const result = response.result || {};
      const downloadUrl = result.video || result.url;
      const title = result.title || "Unknown Title";
      const author = result.author || "Unknown";
      const platform = detectPlatform(text);

      if (!downloadUrl) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "❌ No video found for this link",
          event.threadID,
          event.messageID
        );
      }

      const buffer = (
        await axios.get(downloadUrl, {
          responseType: "arraybuffer",
          timeout: 30000
        })
      ).data;

      await fs.writeFile(filePath, Buffer.from(buffer));
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const speed = ((Date.now() - startTime) / 1000).toFixed(2);

      const msg = `
╭━〔 ✅ Auto Download 〕━╮
┃ 📌 Title     : ${title}
┃ 🌐 Platform  : ${platform}
┃ 👤 Author    : ${author}
┃ ⚡ Speed     : ${speed}s
┃ 🆔 User ID   : ${event.senderID}
╰━━━━━━━━━━━━━━━━━╯
`;

      api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        `❌ Error: ${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
