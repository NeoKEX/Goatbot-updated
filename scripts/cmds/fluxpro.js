const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

const API_ENDPOINT = "https://dev.oculux.xyz/api/flux-1.1-pro"; 

module.exports = {
  config: {
    name: "fluxpro",
    aliases: ["fpro", "flux11"],
    version: "1.0", 
    author: "NeoKEX",
    countDown: 15,
    role: 0,
    longDescription: "Generate an image using the Flux 1.1 Pro model.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function({ message, args, event }) {
    
    let prompt = args.join(" ");

    if (!prompt || !/^[\x00-\x7F]*$/.test(prompt)) {
        return message.reply("❌ Please provide a valid English prompt to generate an image.");
    }

    message.reaction("⏳", event.messageID);
    let tempFilePath; 

    try {
      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt.trim())}`;
      
      const imageDownloadResponse = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 60000 // Extended timeout for large models
      });

      if (imageDownloadResponse.status !== 200) {
           throw new Error(`API request failed with status code ${imageDownloadResponse.status}.`);
      }
      
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
          await fs.mkdirp(cacheDir); 
      }
      
      tempFilePath = path.join(cacheDir, `fluxpro_output_${Date.now()}.png`);
      
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
        body: `Flux Pro image generated ✨`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "An error occurred during image generation.";
      if (error.response) {
         if (error.response.status === 404) {
             errorMessage = "API Endpoint not found (404).";
         } else {
             errorMessage = `HTTP Error: ${error.response.status}`;
         }
      } else if (error.code === 'ETIMEDOUT') {
         errorMessage = `Generation timed out. Try a simpler prompt or check API status.`;
      } else if (error.message) {
         errorMessage = `${error.message}`;
      } else {
         errorMessage = `Unknown error.`;
      }

      console.error("FluxPro Command Error:", error);
      message.reply(`❌ ${errorMessage}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          await fs.unlink(tempFilePath); 
      }
    }
  }
};