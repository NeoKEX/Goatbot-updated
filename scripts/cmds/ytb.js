const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://downloader.nkx.lol";

module.exports = {
  config: {
    name: "ytb",
    version: "2.0",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "YouTube downloader" },
    category: "media",
    guide: { en: "{pn} -a <query> or {pn} -v <query>" }
  },

  onStart: async function ({ message, args, event, api, commandName }) {
    const type = args[0];
    const query = args.slice(1).join(" ");

    if (!["-a", "-v"].includes(type) || !query) {
      return message.reply(`Usage: ${this.config.name} -a <query> or -v <query>`);
    }

    try {
      const res = await axios.get(`${BASE_URL}/api/search/youtube`, {
        params: { q: query, limit: 6 }
      });

      const results = res.data?.results || [];
      if (results.length === 0) return message.reply("No results found.");

      let msg = "";
      const attachments = [];
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      for (let i = 0; i < results.length; i++) {
        msg += `${i + 1}. ${results[i].title}\n[${results[i].duration?.timestamp || results[i].timestamp}]\n\n`;
        const imgPath = path.join(cacheDir, `yt_${Date.now()}_${i}.jpg`);
        const imgRes = await axios.get(results[i].thumbnail, { responseType: "arraybuffer" });
        await fs.writeFile(imgPath, Buffer.from(imgRes.data));
        attachments.push(fs.createReadStream(imgPath));
      }

      message.reply({ body: msg.trim(), attachment: attachments }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: event.senderID,
          results,
          downloadType: type === "-a" ? "audio" : "video"
        });
        attachments.forEach(s => setTimeout(() => fs.remove(s.path).catch(() => {}), 10000));
      });
    } catch (e) {
      message.reply("Search error.");
    }
  },

  onReply: async function ({ message, event, Reply, api }) {
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > Reply.results.length) return;

    const selected = Reply.results[choice - 1];
    api.unsendMessage(event.messageReply.messageID);
    api.setMessageReaction("⏳", event.messageID);

    try {
      const dlRes = await axios.get(`${BASE_URL}/api/download/youtube`, {
        params: { url: selected.url },
        validateStatus: () => true
      });

      if (!dlRes.data?.success) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(dlRes.data?.message || "Download error.");
      }

      const info = dlRes.data.data;
      const streamUrl = Reply.downloadType === "audio" ? info.mp3 : info.mp4;

      if (!streamUrl) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("Unable to retrieve download link.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const ext = Reply.downloadType === "audio" ? "mp3" : "mp4";
      const filePath = path.join(cacheDir, `${Date.now()}.${ext}`);

      const fileRes = await axios.get(streamUrl, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, Buffer.from(fileRes.data));

      await message.reply({
        body: info.title || selected.title,
        attachment: fs.createReadStream(filePath)
      });

      api.setMessageReaction("✅", event.messageID);
      fs.remove(filePath).catch(() => {});
    } catch (e) {
      api.setMessageReaction("❌", event.messageID);
      message.reply("Download error.");
    }
  }
};
