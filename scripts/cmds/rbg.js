const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);
const API_ENDPOINT = "https://free-goat-api.onrender.com/rbg"; 
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
    name: "rbg",
    aliases: ["removebg", "nobg", "bgremove"],
    version: "2.0",
    author: "NeoKEX",
    countDown: 10,
    role: 0,
    longDescription: "Removes the background from an image using AI.",
    category: "image",
    guide: {
      en: 
        "{pn} <image_url> OR reply to an image.\n\n" +
        "• Example: {pn} https://example.com/image.jpg"
    }
  },

  onStart: async function ({ args, message, event }) {
    
    const imageUrl = extractImageUrl(args, event);

    if (!imageUrl) {
      return message.reply("❌ Please provide an image URL or reply to an image to remove its background.");
    }

    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    message.reaction("⏳", event.messageID);
    let tempFilePath; 

    try {
      const fullApiUrl = `${API_ENDPOINT}?url=${encodeURIComponent(imageUrl)}`;
      
      const imageDownloadResponse = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 60000,
      });

      if (imageDownloadResponse.status !== 200) {
           throw new Error(`API request failed with status code ${imageDownloadResponse.status}.`);
      }
      
      const fileHash = Date.now() + Math.random().toString(36).substring(2, 8);
      tempFilePath = path.join(CACHE_DIR, `rbg_${fileHash}.png`);
      
      await pipeline(imageDownloadResponse.data, fs.createWriteStream(tempFilePath));

      message.reaction("✅", event.messageID);
      
      await message.reply({
        body: `🖼️ Background removed successfully!`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "❌ Failed to remove background. An error occurred.";
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

      console.error("RBG Command Error:", error);
      message.reply(errorMessage);

    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
      }
    }
  }
};