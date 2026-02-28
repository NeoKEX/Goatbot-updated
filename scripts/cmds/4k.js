const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);
const API_ENDPOINT = "https://free-goat-api.onrender.com/4k"; 
const CACHE_DIR = path.join(__dirname, 'cache');

function extractImageUrl(args, event) {
    let imageUrl = args.find(arg => arg.startsWith('http'));

    if (!imageUrl && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        const imageAttachment = event.messageReply.attachments.find(att => att.type === 'photo' || att.type === 'image');
        if (imageAttachment && imageAttachment.url) {
            imageUrl = imageAttachment.url;
        }
    }
    return imageUrl;
}

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale", "hd", "enhance"],
    version: "1.0",
    author: "NeoKEX",
    countDown: 15,
    role: 0,
    longDescription: "Upscales an image to higher resolution (simulated 4K) using AI.",
    category: "image",
    guide: {
      en: 
        "{pn} <image_url> OR reply to an image.\n\n" +
        "• Example: {pn} https://example.com/lowres.jpg"
    }
  },

  onStart: async function ({ args, message, event }) {
    
    // Get the image URL from arguments or a replied message
    const imageUrl = extractImageUrl(args, event);

    if (!imageUrl) {
      return message.reply("❌ Please provide an image URL or reply to an image to upscale.");
    }

    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    message.reaction("⏳", event.messageID);
    let tempFilePath; 

    try {
      // 1. Construct the API URL
      const fullApiUrl = `${API_ENDPOINT}?url=${encodeURIComponent(imageUrl)}`;
      
      // 2. Call the API to get the upscaled image URL
      const apiResponse = await axios.get(fullApiUrl, { timeout: 45000 });
      const data = apiResponse.data;

      if (!data.image) {
        throw new Error("API returned success but missing final image URL.");
      }

      const upscaledImageUrl = data.image;

      // 3. Download the upscaled image stream
      const imageDownloadResponse = await axios.get(upscaledImageUrl, {
          responseType: 'stream',
          timeout: 60000,
      });
      
      // 4. Save the stream to a temporary file
      const fileHash = Date.now() + Math.random().toString(36).substring(2, 8);
      tempFilePath = path.join(CACHE_DIR, `upscale_4k_${fileHash}.jpg`);
      
      await pipeline(imageDownloadResponse.data, fs.createWriteStream(tempFilePath));

      message.reaction("✅", event.messageID);
      
      // 5. Reply with the final image
      await message.reply({
        body: `🖼️ Image successfully upscaled to 4K!`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "❌ Failed to upscale image. An error occurred.";
      if (error.response) {
         if (error.response.status === 400) {
             errorMessage = `❌ Error 400: The provided URL might be invalid or the image is too small/large.`;
         } else {
             errorMessage = `❌ HTTP Error ${error.response.status}. The API may be unavailable.`;
         }
      } else if (error.message.includes('timeout')) {
         errorMessage = `❌ Request timed out (API response too slow).`;
      } else if (error.message) {
         errorMessage = `❌ ${error.message}`;
      }

      console.error("4K Upscale Command Error:", error);
      message.reply(errorMessage);

    } finally {
      // Clean up the temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
      }
    }
  }
};