const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music"],
    version: "1.1",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search and download YouTube audio" },
    category: "media",
    guide: { en: "{pn} <song name>" }
  },

  onStart: async function ({ message, args, event, api, commandName }) {
    const query = args.join(" ");
    if (!query) return message.reply("Please provide a song name.");

    try {
      const res = await axios.get(`https://neokex-dlapis.vercel.app/api/search?q=${encodeURIComponent(query)}`);
      const results = res.data.results.slice(0, 6);

      if (results.length === 0) return message.reply("No songs found.");

      let msg = "";
      const attachments = [];
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      for (let i = 0; i < results.length; i++) {
        msg += `${i + 1}. ${results[i].title}\n[${results[i].duration}]\n\n`;
        const imgPath = path.join(cacheDir, `sing_${Date.now()}_${i}.jpg`);
        const imgRes = await axios.get(results[i].thumbnail, { responseType: "arraybuffer" });
        await fs.writeFile(imgPath, Buffer.from(imgRes.data));
        attachments.push(fs.createReadStream(imgPath));
      }

      message.reply({ body: msg.trim(), attachment: attachments }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: event.senderID,
          results
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
      const dlRes = await axios.get(`https://neokex-dlapis.vercel.app/api/alldl?url=${encodeURIComponent(selected.url)}`);
      const pollUrl = dlRes.data.audio.downloadUrl;

      let streamUrl = null;
      for (let i = 0; i < 60; i++) {
        const statusRes = await axios.get(pollUrl);
        if (statusRes.data.status === "completed") {
          streamUrl = statusRes.data.viewUrl;
          break;
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      if (!streamUrl) throw new Error("Processing timeout.");

      const cacheDir = path.join(__dirname, "cache");
      const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
      
      const fileRes = await axios.get(streamUrl, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, Buffer.from(fileRes.data));

      await message.reply({
        body: selected.title,
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
