const axios = require('axios');

module.exports = {
  config: {
    name: "alldl",
    aliases: ["download", "dl"],
    version: "1.7",
    author: "NeoKEX",
    countDown: 5,
    role: 0,
    longDescription: "Download Videos from various Sources.",
    category: "media",
    guide: { en: { body: "{p}{n} [video link]" } }
  },

  onStart: async function({ message, args, event }) {
    let videoUrl = args.join(" ");

    if (!videoUrl) {
      if (event.messageReply && event.messageReply.body) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const foundURLs = event.messageReply.body.match(urlRegex);
        if (foundURLs && foundURLs.length > 0) {
          videoUrl = foundURLs[0];
        } else {
          return message.reply("No URL found. Please provide a valid URL or reply to a message containing one.");
        }
      } else {
        return message.reply("Please provide a URL to start downloading.");
      }
    }

    message.reaction("⏳", event.messageID);
    await download({ videoUrl, message, event });
  },

  onChat: async function({ event, message }) {
    if (event.senderID === global.botID) return;

    try {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const foundURLs = event.body.match(urlRegex);

      if (foundURLs && foundURLs.length > 0) {
        const videoUrl = foundURLs[0];
        message.reaction("⏳", event.messageID); 
        await download({ videoUrl, message, event });
      }
    } catch (error) {
      console.error("onChat Error:", error);
    }
  }
};

async function download({ videoUrl, message, event }) {
  try {
    
    const apiUrl = 'https://neokex-dl-apis.fly.dev/download';
    
    const apiResponse = await axios.post(apiUrl, {
      url: videoUrl
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const apiData = apiResponse.data;

    
    if (!apiData || apiData.success !== true || !apiData.data || !apiData.data.streamUrl) {
      
      const errorMessage = apiData && apiData.error ? apiData.error : "Failed to download video. The URL may be invalid or the platform is not supported.";
      throw new Error(errorMessage);
    }

    const videoTitle = apiData.data.title || "Video Download";
    const videoStreamUrl = apiData.data.streamUrl;

    
    const videoStream = await axios({
      method: 'get',
      url: videoStreamUrl,
      responseType: 'stream'
    });

    message.reaction("✅", event.messageID);

    message.reply({
      body: `Title: ${videoTitle}\nSource: ${apiData.data.source || 'N/A'}\nQuality: ${apiData.data.quality || 'N/A'}`,
      attachment: videoStream.data
    });
  } catch (error) {
    message.reaction("❌", event.messageID);
    console.error("Download Error:", error.message || error);
    
  }
}
