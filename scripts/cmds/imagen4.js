const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

const API_ENDPOINT = "https://neokex-img-api.vercel.app/generate"; 

module.exports = {
  config: {
    name: "imagen4",
    aliases: ["img4", "gen4"],
    version: "1.0", 
    author: "NeoKEX",
    countDown: 15,
    role: 0,
    longDescription: "Generate a high-quality image using the Imagen 4 model.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function({ message, args, event }) {
    
    let prompt = args.join(" ");

    if (!prompt) {
        return message.reply("❌ Please provide a prompt to generate an image.");
    }

    message.reaction("🎨", event.messageID);
    let tempFilePath; 

    try {
      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt.trim())}&m=imagen4`;
      
      const imageDownloadResponse = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 60000
      });

      if (imageDownloadResponse.status !== 200) {
           throw new Error(`API returned status ${imageDownloadResponse.status}`);
      }
      
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
          await fs.ensureDirSync(cacheDir); 
      }
      
      tempFilePath = path.join(cacheDir, `imagen4_${Date.now()}.png`);
      
      const writer = fs.createWriteStream(tempFilePath);
      imageDownloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", (err) => {
          writer.close();
          reject(err);
        });
      });

      message.reaction("✅", event.messageID);
      await message.reply({
        body: `✨ Imagen 4 image Generated`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      console.error("Imagen4 Error:", error);
      
      let msg = "Failed to generate image.";
      if (error.code === 'ECONNABORTED') msg = "The request timed out. The server is taking too long.";
      
      message.reply(`❌ ${msg}\nError: ${error.message}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            await fs.unlink(tempFilePath);
          } catch (e) {
            console.error("Cleanup error:", e);
          }
      }
    }
  }
};
