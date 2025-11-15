const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function download({ videoUrl, message, event }) {
  const apiUrl = `https://neokex-dl-apis.fly.dev/download`;
  let tempFilePath = ''; // Declare outside try/catch for cleanup

  try {
    // 1. Send POST request to the API endpoint
    const apiResponse = await axios.post(apiUrl, 
      { url: videoUrl }, 
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const { success, data } = apiResponse.data;

    if (!success || !data || !data.streamUrl) {
      throw new Error("API response failed or missing download URL.");
    }
    
    const { title, source: platform, streamUrl: downloadUrl } = data;

    // 2. Download the video stream
    const videoStreamResponse = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });
    
    // 3. Reintroduce reliable file saving
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
    }
    
    // Create a temporary file path
    tempFilePath = path.join(cacheDir, `${Date.now()}_${title.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.mp4`);
    
    // Pipe the stream to the temporary file
    const writer = fs.createWriteStream(tempFilePath);
    videoStreamResponse.data.pipe(writer);

    // Wait for the file to finish writing
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    message.reaction("✅", event.messageID);

    // 4. Reply using the local file path
    await message.reply({
      body: `Title: ${title}\nPlatform: ${platform}\nUrl: ${downloadUrl}`,
      attachment: fs.createReadStream(tempFilePath) 
    });

    // 5. Clean up the temporary file
    fs.unlinkSync(tempFilePath);

  } catch (error) {
    message.reaction("❌", event.messageID);
    console.error("Download Error:", error.message || error);
    message.reply("An error occurred during download. Please check the URL and try again.");
    
    // Attempt cleanup if a file was partially created
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
    }
  }
}

module.exports = {
  config: {
    name: "alldl",
    aliases: ["download"],
    version: "2.2", 
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
        return message.reply(`Auto-download has been turned ${choice ? 'on' : 'off'} for this group.`);
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