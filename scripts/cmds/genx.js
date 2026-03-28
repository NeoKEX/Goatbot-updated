const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "genx",
    aliases: [],
    version: "1.0",
    author: "Vex_Kshitiz",
    countDown: 50,
    role: 0,
    longDescription: {
      vi: '',
      en: "Generate images"
    },
    category: "ai",
    guide: {
      vi: '',
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, commandName, event, args }) {
    try {
      api.setMessageReaction("✅", event.messageID, (a) => {}, true);
      const prompt = args.join(' ');

      const response = await axios.get(`https://dall-e-tau-steel.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}`);
      const imageUrl = response.data.response;

      const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imgPath = path.join(__dirname, 'cache', 'dalle_image.jpg');
      await fs.outputFile(imgPath, imgResponse.data);
      const imgData = fs.createReadStream(imgPath);

      await api.sendMessage({ body: '', attachment: imgData }, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error:", error);
      api.sendMessage("Error generating image. Please try again later.", event.threadID, event.messageID);
    }
  }
};
