const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

const API_ENDPOINT = "https://dev.oculux.xyz/api/fluxkontext"; 
const REF_FLAG = "--ref";

module.exports = {
  config: {
    name: "fluxkontext",
    aliases: ["fk", "flux"],
    version: "1.0", 
    author: "NeoKEX",
    countDown: 15,
    role: 0,
    longDescription: "Generate an image using the FluxKontext model, optionally referencing an existing image.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt> [--ref <image_url>]"
    }
  },

  onStart: async function({ message, args, event }) {
    let prompt = args.join(" ");
    let refUrl = null;

    // 1. Check for the optional --ref flag and extract the URL
    const refIndex = prompt.indexOf(REF_FLAG);
    if (refIndex !== -1) {
      // Extract the rest of the string after '--ref '
      const refPart = prompt.substring(refIndex + REF_FLAG.length).trim();
      
      // Assume the URL is the first 'word' (token) after the flag
      const urlMatch = refPart.match(/^(https?:\/\/[^\s]+)/i);
      if (urlMatch) {
        refUrl = urlMatch[0];
      }
      
      // Remove the flag and the URL from the main prompt
      prompt = prompt.substring(0, refIndex).trim();
    }

    if (!prompt || !/^[\x00-\x7F]*$/.test(prompt)) {
        return message.reply("❌ Please provide a valid English prompt to generate an image.");
    }
    
    // Validate the reference URL format if one was found
    if (refUrl && !refUrl.match(/^https?:\/\/[^\s$.?#].[^\s]*$/i)) {
        return message.reply("❌ Invalid URL provided with the `--ref` flag.");
    }

    message.reaction("⏳", event.messageID);
    let tempFilePath; 

    try {
      let fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt.trim())}`;
      
      // 2. Append the optional 'ref' parameter if a URL was extracted
      if (refUrl) {
        fullApiUrl += `&ref=${encodeURIComponent(refUrl)}`;
      }
      
      const imageDownloadResponse = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 60000 // Extended timeout for potentially complex tasks
      });

      if (imageDownloadResponse.status !== 200) {
           throw new Error(`API request failed with status code ${imageDownloadResponse.status}.`);
      }
      
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
          await fs.mkdirp(cacheDir); 
      }
      
      tempFilePath = path.join(cacheDir, `fluxkontext_output_${Date.now()}.png`);
      
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
        body: `FluxKontext image generated ✨`,
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

      console.error("FluxKontext Command Error:", error);
      message.reply(`❌ ${errorMessage}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          await fs.unlink(tempFilePath); 
      }
    }
  }
};