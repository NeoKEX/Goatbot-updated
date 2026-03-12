module.exports = {
  config: {
    name: "bav",
    version: "1.0",
    author: "VincentSensei",
    countDown: 5,
    role: 0,
    description: {
      vi: "Video ngẫu nhiên Blue Archive",
      en: "Random Blue Archive Video"
    },
    category: "media",
    guide: {
      vi: "   {pn}",
      en: "   {pn}"
    }
  },

  onStart: async function ({ api, message, event }) {
    try {
      const axios = require("axios");
      const fs = require("fs-extra");
      const path = require("path");

      // Add loading reaction and message
      message.reaction("⏳", event.messageID);
      const loadingMsg = await message.reply("⏳ Downloading random Blue Archive video...");

      const response = await axios.get("https://blue-archive-random-video-api.onrender.com/api/request/f");
      const videoUrl = response.data.url;

      const title = response.data.title || "Blue Archive Video";
      const author = response.data.nickname || "";
      const username = response.data.username || "";
      
      const safeTitle = title.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
      const filename = `${Date.now()}_${safeTitle}.mp4`;
      const filePath = path.join(__dirname, filename);

      const writer = fs.createWriteStream(filePath);
      const videoResponse = await axios({
          url: videoUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 300000
      });

      videoResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
      });

      await message.reply({
        body: `Title: ${title}\nAuthor: ${author} (@${username})`,
        attachment: fs.createReadStream(filePath)
      });

      // Remove loading indicator, add success reaction
      api.unsendMessage(loadingMsg.messageID);
      message.reaction("✅", event.messageID);

      // Clean up the file after sending
      fs.unlink(filePath).catch(console.error);

    } catch (e) {
      console.error("Error fetching Blue Archive random video:", e);
      message.reaction("❌", event.messageID);
      return message.reply("Failed to get video. Please try again later.");
    }
  }
};
