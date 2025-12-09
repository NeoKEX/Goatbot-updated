const axios = require('axios');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);
const API_ENDPOINT = "https://dev.oculux.xyz/api/screenshot";
const CACHE_DIR = path.join(__dirname, 'cache');

module.exports = {
  config: {
    name: "screenshot",
    aliases: ["ss", "webss"],
    version: "1.0",
    author: "NeoKEX",
    countDown: 10,
    role: 0,
    longDescription: "Captures a full-page screenshot of a given website URL.",
    category: "tools",
    guide: {
      en: "{pn} <URL> (e.g., {pn} https://google.com)"
    }
  },

  onStart: async function ({ args, message, event }) {
    const userUrl = args[0];

    if (!userUrl) {
      return message.reply("❌ Please provide a URL to capture. Example: `!screenshot https://google.com`");
    }

    // Basic URL validation
    if (!userUrl.startsWith('http://') && !userUrl.startsWith('https://')) {
        return message.reply("❌ Invalid URL. Please include `http://` or `https://`.");
    }

    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    message.reaction("⏳", event.messageID);
    
    let tempFilePath;

    try {
      // Construct the full API URL
      const fullApiUrl = `${API_ENDPOINT}?url=${encodeURIComponent(userUrl)}`;
      
      // Request the screenshot image stream
      const imageDownloadResponse = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 60000 
      });

      if (imageDownloadResponse.status !== 200) {
           throw new Error(`API request failed with status code ${imageDownloadResponse.status}.`);
      }

      // Create a unique temporary file path
      const fileHash = Date.now() + Math.random().toString(36).substring(2, 8);
      tempFilePath = path.join(CACHE_DIR, `screenshot_${fileHash}.png`);
      
      // Pipe the image stream to the file
      await pipeline(imageDownloadResponse.data, fs.createWriteStream(tempFilePath));

      message.reaction("✅", event.messageID);
      
      // Reply with the screenshot
      await message.reply({
        body: `✨ Here is the screenshot for ${userUrl}`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "An error occurred during screenshot generation.";
      if (error.response) {
         errorMessage = `HTTP Error: ${error.response.status}. The URL may be invalid or unreachable.`;
      } else if (error.code === 'ETIMEDOUT') {
         errorMessage = `Request timed out (60 seconds).`;
      } else if (error.message) {
         errorMessage = `${error.message}`;
      }

      console.error("Screenshot Command Error:", error);
      message.reply(`❌ ${errorMessage}`);
      
    } finally {
      // Clean up the temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
      }
    }
  }
};