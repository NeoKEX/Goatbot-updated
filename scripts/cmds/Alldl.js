const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "alldl",
    aliases: ["fbdl", "igdl", "ttdl", "ytdl", "dl"],
    version: "2.1",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Multi-platform video downloader" },
    longDescription: { en: "Download videos from FB, IG, TikTok, YT via link or auto-detection." },
    category: "media",
    guide: { en: "{pn} <url> or reply to a link. Use '{pn} auto' to toggle auto-download." }
  },

  onStart: async function ({ message, args, event, api }) {
    const input = args[0];

    if (input === "auto") {
      if (!global.alldl_auto) global.alldl_auto = {};
      const threadID = event.threadID;
      global.alldl_auto[threadID] = global.alldl_auto[threadID] === false ? true : false;
      return message.reply(`Auto-download is now ${global.alldl_auto[threadID] ? "ON" : "OFF"}.`);
    }

    let url = input;
    const { type, messageReply } = event;

    if (type === "message_reply") {
      const replyText = messageReply.body;
      const urlMatch = replyText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) url = urlMatch[0];
    }

    if (!url || !url.startsWith("http")) {
      return message.reply("Please provide a valid link or reply to one.");
    }

    return this.handleDownload({ message, event, api, url });
  },

  onChat: async function ({ message, event, api }) {
    const threadID = event.threadID;
    if (!global.alldl_auto) global.alldl_auto = {};
    
    if (global.alldl_auto[threadID] === false) return;
    if (!event.body || typeof event.body !== 'string') return;

    const urlMatch = event.body.match(/https?:\/\/(www\.)?(facebook|fb|instagram|tiktok|youtube|youtu|shorts)\.[^\s]+/);
    if (urlMatch && !event.body.startsWith(global.GoatBot.config.prefix)) {
      return this.handleDownload({ message, event, api, url: urlMatch[0] });
    }
  },

  handleDownload: async function ({ message, event, api, url }) {
    api.setMessageReaction("⏳", event.messageID);
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `dl_${Date.now()}.mp4`);

    try {
      const res = await axios.get(`https://neoaz.is-a.dev/api/download?url=${encodeURIComponent(url)}`);
      const videoUrl = res.data.video?.directUrl || res.data.video?.downloadUrl;
      const title = res.data.info?.title || "Downloaded Video";

      if (!videoUrl) throw new Error("Could not find direct stream URL.");

      const response = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      await message.reply({
        body: title,
        attachment: fs.createReadStream(filePath)
      });

      api.setMessageReaction("✅", event.messageID);
    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", event.messageID);
    } finally {
      if (fs.existsSync(filePath)) {
        setTimeout(() => fs.unlinkSync(filePath), 10000);
      }
    }
  }
};
