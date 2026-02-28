const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

const API_ENDPOINT = "https://neokex-img-api.vercel.app/generate"; 

module.exports = {
  config: {
    name: "gpt",
    aliases: ["gpt1.5", "gptimg"],
    version: "1.0", 
    author: "NeoKEX",
    countDown: 15,
    role: 0,
    longDescription: "Generate an image using the GPT 1.5 model.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function({ message, args, event }) {
    
    let prompt = args.join(" ");

    if (!prompt) {
        return message.reply("❌ Please provide a prompt.");
    }

    message.reaction("🚬", event.messageID);
    let tempFilePath; 

    try {
      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt.trim())}&model=gpt1.5`;
      
      const response = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 60000 
      });

      if (response.status !== 200) {
           throw new Error(`API error: ${response.status}`);
      }
      
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
          await fs.ensureDir(cacheDir); 
      }
      
      tempFilePath = path.join(cacheDir, `gpt_${Date.now()}.png`);
      
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      message.reaction("✅", event.messageID);
      await message.reply({
        body: `gpt 1.5 image generated 🐦`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      message.reply(`❌ Error: ${error.message}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          await fs.unlink(tempFilePath);
      }
    }
  }
};
