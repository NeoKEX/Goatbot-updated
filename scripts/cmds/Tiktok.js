const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const TIKTOK_SEARCH_API = 'https://lyric-search-neon.vercel.app/kshitiz?keyword=';
const CACHE_DIR = path.join(__dirname, 'tiktok_cache');

async function getStreamFromURL(url) {
  const response = await axios({
    url: url,
    responseType: 'stream',
    timeout: 180000 
  });
  return response.data;
}

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tt"],
    version: "1.0.0",
    author: "Neoaz ゐ",
    countDown: 5,
    role: 0,
    description: { en: "Search and download TikTok video" },
    category: "media",
    guide: { en: "{pn} <search query>\n{pn} -v <search query>" }
  },

  onStart: async function ({ api, args, event, commandName }) {
    const prefix = args[0];
    const query = args.slice(1).join(" ");

    if (prefix === "-v") {
        if (!query) return api.sendMessage("❌ Provide a search query.", event.threadID, event.messageID);
        await handleSearchAndDownload(query, api, event, commandName);
    } else {
        const fullQuery = args.join(" ");
        if (!fullQuery) return api.sendMessage("❌ Provide a search query.", event.threadID, event.messageID);
        await handleSearchAndDownload(fullQuery, api, event, commandName);
    }
  },

  onReply: async function ({ event, api, Reply }) {
    const { results } = Reply;
    const selection = parseInt(event.body);

    if (isNaN(selection) || selection < 1 || selection > results.length) {
      return api.sendMessage("❌ Invalid selection. Choose 1-" + results.length + ".", event.threadID, event.messageID);
    }

    const selectedVideo = results[selection - 1];
    await api.unsendMessage(Reply.messageID);

    await downloadVideo(selectedVideo, api, event);
  }
};

async function handleSearchAndDownload(query, api, event, commandName) {
    try {
        api.sendMessage("🔎 Searching TikTok for: " + query, event.threadID, event.messageID);
        
        const searchResponse = await axios.get(TIKTOK_SEARCH_API + encodeURIComponent(query), { timeout: 20000 });
        const results = searchResponse.data.slice(0, 6);

        if (!results || results.length === 0) {
            return api.sendMessage("❌ No TikTok videos found for the query.", event.threadID, event.messageID);
        }

        let messageBody = "";
        const thumbnailPromises = [];

        results.forEach((video, index) => {
            messageBody += `${index + 1}. ${video.title.substring(0, 70)}...\n`;
            messageBody += `   • Creator: @${video.author.unique_id}\n`;
            messageBody += `   • Duration: ${video.duration}s\n\n`;
            if (video.cover) {
                thumbnailPromises.push(getStreamFromURL(video.cover));
            }
        });

        const attachments = await Promise.all(thumbnailPromises);
        const validAttachments = attachments.filter(a => a !== null);

        api.sendMessage(
            { 
                body: "Found " + results.length + " videos.\n\n" + messageBody + "Reply with the number (1-" + results.length + ") to download the video.",
                attachment: validAttachments
            },
            event.threadID,
            (err, info) => {
                if (err) {
                    console.error("Error sending search results:", err);
                    return api.sendMessage("❌ Failed to display results.", event.threadID, event.messageID);
                }
                
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: commandName,
                    messageID: info.messageID,
                    author: event.senderID,
                    results: results
                });
            },
            event.messageID
        );
    } catch (error) {
        console.error("TikTok Search Error:", error);
        api.sendMessage("❌ Failed to search TikTok or API error.", event.threadID, event.messageID);
    }
}

async function downloadVideo(videoInfo, api, event) {
    let filePath = null;

    try {
        api.sendMessage("⏳ Downloading video: " + videoInfo.title.substring(0, 50) + "...", event.threadID);

        await fs.ensureDir(CACHE_DIR);

        const safeTitle = videoInfo.title.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
        const filename = `${Date.now()}_${safeTitle}.mp4`;
        filePath = path.join(CACHE_DIR, filename);

        const writer = fs.createWriteStream(filePath);
        const response = await axios({
            url: videoInfo.videoUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 300000
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await api.sendMessage(
            { 
                body: `✅ Downloaded: ${videoInfo.title}\nCreator: @${videoInfo.author.unique_id}\nDuration: ${videoInfo.duration}s`,
                attachment: fs.createReadStream(filePath) 
            },
            event.threadID,
            (err) => {
                if (err) console.error("Error sending file:", err);
                fs.unlink(filePath).catch(console.error);
            },
            event.messageID
        );

    } catch (error) {
        console.error("TikTok Download Error:", error);
        api.sendMessage("❌ Failed to download the video stream.", event.threadID, event.messageID);
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            await fs.unlink(filePath).catch(console.error);
        }
    }
        }
                                            
