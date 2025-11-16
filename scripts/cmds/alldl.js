const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function download({ videoUrl, message, event }) {
  const apiUrl = `https://neoaz.is-a.dev/api/alldl?url=${encodeURIComponent(videoUrl)}`;
  
  try {
    const apiResponse = await axios.get(apiUrl);
    const videoData = apiResponse.data;

    if (!videoData || !videoData.cdnUrl || !videoData.data || !videoData.data.title) {
      throw new Error("Invalid response or missing CDN URL/data from API.");
    }
    
    // Updated: Get title and platform from the 'data' object
    const { title, source } = videoData.data;
    const platform = source; // Using 'source' as 'platform'
    const { cdnUrl } = videoData; 

    // Use cdnUrl for streaming/download
    const videoStreamResponse = await axios({
      method: 'get',
      url: cdnUrl,
      responseType: 'stream'
    });
    
    const tempFilePath = path.join(__dirname, 'cache', `${Date.now()}_${title.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.mp4`);
    
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
    }

    const writer = fs.createWriteStream(tempFilePath);
    videoStreamResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    message.reaction("✓", event.messageID);

    // Reply body as requested (no bolding)
    await message.reply({
      body: `Title: ${title}\nPlatform: ${platform}\nUrl: ${cdnUrl}`,
      attachment: fs.createReadStream(tempFilePath)
    });
    
    fs.unlinkSync(tempFilePath);

  } catch (error) {
    message.reaction("×", event.messageID);
    console.error("Download Error:", error.message || error);
    message.reply("An error occurred during download. Please check the URL and try again.");
    const tempFilePath = path.join(__dirname, 'cache', `${Date.now()}_temp.mp4`); 
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  }
}

module.exports = {
  config: {
    name: "alldl",
    aliases: ["download"],
    version: "1.9", // Version update
    author: "NeoKEX", 
    countDown: 5,
    role: 0,
    longDescription: "Download Videos from various Sources.",
    category: "media",
    guide: { en: { body: "{p}{n} [video link] or reply to a message containing a link." } }
  },

  onStart: async function({ message, args, event, threadsData, role }) {
    let videoUrl = args.join(" ");
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    if ((args[0] === 'chat' && (args[1] === 'on' || args[1] === 'off')) || args[0] === 'on' || args[0] === 'off') {
      if (role >= 1) {
        const choice = args[0] === 'on' || args[1] === 'on';
        await threadsData.set(event.threadID, { data: { autoDownload: choice } });
        // No bolding here as requested globally
        return message.reply(`Auto-download turned ${choice ? 'on' : 'off'} for this group.`);
      } else {
        return message.reply("You don't have permission to toggle auto-download.");
      }
    }

    if (!videoUrl) {
      if (event.messageReply && event.messageReply.body) {
        const foundURLs = event.messageReply.body.match(urlRegex);
        if (foundURLs && foundURLs.length > 0) {
          videoUrl = foundURLs[0];
        } 
      }
    }

    if (!videoUrl || !videoUrl.match(urlRegex)) {
      return message.reply("No valid URL found. Please provide a video link or reply to a message containing one.");
    }

    message.reaction("⏳", event.messageID);
    await download({ videoUrl, message, event });
  },

  onChat: async function({ event, message, threadsData }) {
    const threadData = await threadsData.get(event.threadID);
    if (!threadData.data.autoDownload || event.senderID === global.botID) return;

    try {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const foundURLs = event.body.match(urlRegex);

      if (foundURLs && foundURLs.length > 0) {
        const videoUrl = foundURLs[0];
        message.reaction("⏳", event.messageID); 
        await download({ videoUrl, message, event });
      }
    } catch (error) {
      
    }
  }
};