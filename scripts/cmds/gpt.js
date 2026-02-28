const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

const API_ENDPOINT = "https://dev.oculux.xyz/api/gptimage"; 
const SEED_FLAG = "--seed";
const WIDTH_FLAG = "--width";
const HEIGHT_FLAG = "--height";

module.exports = {
  config: {
    name: "gpt",
    aliases: ["gptimg", "aimage"],
    version: "1.0", 
    author: "NeoKEX",
    countDown: 20,
    role: 0,
    longDescription: "Generate or edit an image using the GPT Image model. Reply to an image to edit it.",
    category: "ai-image",
    guide: {
      en: 
        "{pn} <prompt> [--seed <true/false or number>] [--width <pixels>] [--height <pixels>]\n" +
        "• To generate: {pn} a futuristic city\n" +
        "• To edit: Reply to an image with {pn} remove the background\n" +
        "• With options: {pn} a cat playing guitar --seed 12345 --width 1024 --height 768"
    }
  },

  onStart: async function({ message, args, event }) {
    let rawPrompt = args.join(" ");
    let prompt = rawPrompt;
    let refUrl = null;
    let seed = null;
    let width = null;
    let height = null;

    if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
      const imageAttachment = event.messageReply.attachments.find(att => att.type === 'photo' || att.type === 'image');
      if (imageAttachment && imageAttachment.url) {
        refUrl = imageAttachment.url;
      }
    }

    const extractFlag = (flagName, regex) => {
      const match = prompt.match(regex);
      if (match && match[1]) {
        prompt = prompt.replace(match[0], "").trim();
        return match[1];
      }
      return null;
    };

    const seedValue = extractFlag(SEED_FLAG, new RegExp(`${SEED_FLAG}\\s+([^\\s]+)`, 'i'));
    if (seedValue) {
      if (seedValue.toLowerCase() === 'true') {
        seed = true;
      } else if (seedValue.toLowerCase() === 'false') {
        seed = false;
      } else if (!isNaN(parseInt(seedValue))) {
        seed = parseInt(seedValue);
      }
    }

    const widthValue = extractFlag(WIDTH_FLAG, new RegExp(`${WIDTH_FLAG}\\s+(\\d+)`, 'i'));
    if (widthValue) width = parseInt(widthValue);

    const heightValue = extractFlag(HEIGHT_FLAG, new RegExp(`${HEIGHT_FLAG}\\s+(\\d+)`, 'i'));
    if (heightValue) height = parseInt(heightValue);

    prompt = prompt.trim();

    if (!prompt || !/^[\x00-\x7F]*$/.test(prompt)) {
        return message.reply("❌ Please provide a valid English prompt for image generation or editing.");
    }
    
    message.reaction("⏳", event.messageID);
    let tempFilePath; 

    try {
      let fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}`;
      
      if (refUrl) {
        fullApiUrl += `&ref=${encodeURIComponent(refUrl)}`;
      }
      if (seed !== null) {
        fullApiUrl += `&seed=${seed}`;
      }
      if (width !== null) {
        fullApiUrl += `&width=${width}`;
      }
      if (height !== null) {
        fullApiUrl += `&height=${height}`;
      }
      
      const imageDownloadResponse = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 90000
      });

      if (imageDownloadResponse.status !== 200) {
           throw new Error(`API request failed with status code ${imageDownloadResponse.status}.`);
      }
      
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
          await fs.mkdirp(cacheDir); 
      }
      
      tempFilePath = path.join(cacheDir, `gpt_image_output_${Date.now()}.png`);
      
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
        body: `GPT Image ${refUrl ? "edited" : "generated"} ✨`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "An error occurred during image generation/editing.";
      if (error.response) {
         if (error.response.status === 404) {
             errorMessage = "API Endpoint not found (404).";
         } else {
             errorMessage = `HTTP Error: ${error.response.status}`;
         }
      } else if (error.code === 'ETIMEDOUT') {
         errorMessage = `Operation timed out. Try a simpler prompt or check API status.`;
      } else if (error.message) {
         errorMessage = `${error.message}`;
      } else {
         errorMessage = `Unknown error.`;
      }

      console.error("GPT Image Command Error:", error);
      message.reply(`❌ ${errorMessage}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          await fs.unlink(tempFilePath); 
      }
    }
  }
};