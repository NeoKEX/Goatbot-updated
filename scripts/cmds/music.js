const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes("youtube.com")) {
      const urlParams = new URLSearchParams(urlObj.search);
      return urlParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

function cleanUrl(url) {
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
  }
  const videoId = extractVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

module.exports = {
  config: {
    name: "music",
    version: "1.0.4",
    author: "lianecagara | Jonell-Magallanes | VincentSensei",
    countDown: 5,
    role: 0,
    description: "Play and Download Youtube Music",
    category: "media",
    guide: {
      en: "{pn} <song name | url> - Search or download music from YouTube"
    }
  },

  onStart: async function ({ api, message, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return message.reply("❌ Please provide a song name or YouTube URL to search.");
    }

    message.reaction("⏳", event.messageID);
    const processingMsg = await message.reply("⏳ Processing....");

    try {
      const yts = require("yt-search");
      
      let video;
      let url;
      
      // Check if it's a direct URL
      const isUrl = /^https?:\/\//.test(args[0]);
      
      if (isUrl) {
        const cleanInputUrl = cleanUrl(args[0]);
        const videoId = extractVideoId(cleanInputUrl);
        if (!videoId) {
          api.unsendMessage(processingMsg.messageID);
          message.reaction("❌", event.messageID);
          return message.reply("❌ Invalid YouTube URL.");
        }
        
        const searchResults = await yts({ videoId });
        if (!searchResults) {
          api.unsendMessage(processingMsg.messageID);
          message.reaction("❌", event.messageID);
          return message.reply("❌ No results found.");
        }
        video = searchResults;
        url = cleanInputUrl;
      } else {
        const search = await yts(query);
        if (!search.videos || search.videos.length === 0) {
          api.unsendMessage(processingMsg.messageID);
          message.reaction("❌", event.messageID);
          return message.reply("❌ No results found.");
        }
        video = search.videos[0];
        url = video.url;
      }

      // Extract direct URL for the full MP3 file bypassing ytdl-core limits
      const apiUrl = `https://api.nixhost.top/aryan/yx?url=${encodeURIComponent(url)}&type=mp3`;
      const res = await axios.get(apiUrl, { timeout: 30000 });
      const download = res.data.download_url;

      if (!download) {
        api.unsendMessage(processingMsg.messageID);
        return message.reply("❌ Could not get full audio stream URL.");
      }

      const safeTitle = video.title.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
      const filename = `${Date.now()}_${safeTitle}.mp3`;
      const filePath = path.join(__dirname, filename);

      const writer = fs.createWriteStream(filePath);
      const audioResponse = await axios({
        url: download,
        method: 'GET',
        responseType: 'stream',
        timeout: 300000
      });

      audioResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const musicInfo = `🎶 Title: ${video.title}
👤 Channel: ${video.author.name}
⏱️ Duration: ${video.timestamp}
🔗 YouTube: ${video.url}

💾 Type "dl" or "download" to get the raw stream link.`;

      const sentMessage = await message.reply({
        body: musicInfo,
        attachment: fs.createReadStream(filePath)
      });

      api.unsendMessage(processingMsg.messageID);
      message.reaction("✅", event.messageID);

      // Clean up the file after sending
      fs.unlink(filePath).catch(console.error);

      // Register the reply event for 'dl'
      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: this.config.name,
        messageID: sentMessage.messageID,
        author: event.senderID,
        downloadUrl: download
      });

    } catch (error) {
      console.error("[Music Command] Error:", error.message);
      message.reaction("❌", event.messageID);
      await message.reply(`❌ Error: ${error.message}`);
      try {
        api.unsendMessage(processingMsg.messageID);
      } catch {}
    }
  },

  onReply: async function ({ api, message, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const { body } = event;
    const messageText = body.toLowerCase().trim();

    if (messageText === "dl" || messageText === "download") {
      const downloadMessage = await message.reply(`📥 Download URL:\n${Reply.downloadUrl}`);
      
      // Unsend the download link after 50 seconds, like Zeyah does
      setTimeout(async () => {
        try {
          api.unsendMessage(downloadMessage.messageID);
        } catch (e) {}
      }, 50000);
    }
  }
};
