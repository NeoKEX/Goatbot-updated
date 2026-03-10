const axios = require('axios');

let fontEnabled = true;

function formatFont(text) {
  const fontMapping = {
    a: "𝖺", b: "𝖻", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿", g: "𝗀", h: "𝗁", i: "𝗂", j: "𝗃", k: "𝗄", l: "𝗅", m: "𝗆",
    n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋", s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑", y: "𝗒", z: "𝗓",
    A: "𝖠", B: "𝖡", C: "𝖢", D: "𝖣", E: "𝖤", F: "𝖥", G: "𝖦", H: "𝖧", I: "𝖨", J: "𝖩", K: "𝖪", L: "𝖫", M: "𝖬",
    N: "𝖭", O: "𝖮", P: "𝖯", Q: "𝖰", R: "𝖱", S: "𝖲", T: "𝖳", U: "𝖴", V: "𝖵", W: "𝖶", X: "𝖷", Y: "𝖸", Z: "𝖹"
  };
  return [...text].map(char => fontEnabled && fontMapping[char] ? fontMapping[char] : char).join('');
}

module.exports = {
  config: {
    name: 'gemini',
    aliases: ['gv', 'gvision', 'gemini-lite'],
    version: '1.0.0',
    author: 'Ry',
    role: 0,
    shortDescription: {
      en: 'Analyze image or prompt using Gemini Vision API'
    },
    longDescription: {
      en: 'Analyze images or answer prompts using Google\'s Gemini Vision AI model'
    },
    category: 'ai',
    guide: {
      en: 'Use {p}gemini [prompt] or reply to an image with {p}gemini [question]'
    },
    cooldown: 3,
  },

  onStart: async function ({ api, event, args }) {
    const promptText = args.join(" ").trim();
    const replyText = event.messageReply?.body || '';

    let finalPrompt = promptText;
    if (replyText) {
      finalPrompt = replyText + (promptText ? ' ' + promptText : '');
    }

    const senderID = event.senderID;
    const threadID = event.threadID;
    const messageID = event.messageID;

    const imageUrl = event.messageReply?.attachments?.[0]?.type === 'photo' 
      ? event.messageReply.attachments[0].url 
      : null;

    if (!imageUrl && !finalPrompt) {
      return api.sendMessage(formatFont("❌ Please provide a prompt or reply to an image."), threadID, messageID);
    }

    const thinkingMsg = imageUrl ? "🤖 𝗚𝗘𝗠𝗜𝗡𝗜 𝗜𝗦 𝗔𝗡𝗔𝗟𝗬𝗭𝗜𝗡𝗚..." : "🤖 𝗚𝗘𝗠𝗜𝗡𝗜 𝗜𝗦 𝗧𝗛𝗜𝗡𝗞𝗜𝗡𝗚...";

    api.sendMessage(formatFont(thinkingMsg), threadID, async (err, info) => {
      if (err) return;

      try {
        // Updated API endpoint with new structure
        const baseUrl = "https://kryptonite-api-library.onrender.com/api/gemini-lite";
        const params = new URLSearchParams();

        // Add prompt parameter
        if (finalPrompt) {
          params.append('prompt', finalPrompt);
        } else {
          params.append('prompt', "what is this");
        }

        // Add uid parameter (required by the new API)
        params.append('uid', senderID);

        // Add image URL parameter if available
        if (imageUrl) {
          params.append('imgUrl', imageUrl);
        }

        // Add apikey parameter (seems required based on the URL)
        params.append('apikey', ' YOUR_APIKEY');

        const apiUrl = ${baseUrl}?${params.toString()};

        const { data } = await axios.get(apiUrl);

        // Extract response based on the new API structure
        const responseText = data?.response || data?.description || "❌ No response received from the Gemini API.";

        api.getUserInfo(senderID, (err, infoUser) => {
          const userName = infoUser?.[senderID]?.name || "Unknown User";

          const now = new Date();
          const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
          const timePH = phTime.toLocaleString('en-US', { 
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          const replyMessage = `
🤖 𝗚𝗘𝗠𝗜𝗡𝗜 ☆
━━━━━━━━━━━━━━━━━━
${responseText}
━━━━━━━━━━━━━━━━━━
🗣 𝗔𝘀𝗸𝗲𝗱 𝗕𝘆: ${userName}
⏰ 𝗧𝗶𝗺𝗲: ${timePH}`.trim();

          api.editMessage(formatFont(replyMessage), info.messageID);
        });

      } catch (error) {
        console.error("Gemini API Error:", error);

        let errorMessage = "❌ Error: ";

        if (error.response?.status === 500) {
          errorMessage += "The Gemini API server is currently experiencing issues (500 Internal Server Error). Please try again later.";
        } else if (error.response?.data?.message) {
          errorMessage += error.response.data.message;
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += "Unknown error occurred.";
        }

        api.editMessage(formatFont(errorMessage), info.messageID);
      }
    });
  }
};
Ry
const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
const { getStreamFromURL, shortenURL, randomString } = global.utils;

async function shotiVideo(api, event, args, message) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);

    try {
        // Fetch video from Hiroshi API
        const apiUrl = 'https://hiroshi-api.onrender.com/video/eabab';
        const response = await axios.get(apiUrl);
        const videoData = response.data;

        if (!videoData || !videoData.link) {
            message.reply("No video found from the API.");
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return;
        }

        // Get video details
        const videoUrl = videoData.link;
        const title = videoData.title || "No title";
        const username = videoData.username || "Unknown";
        const displayname = videoData.displayname || "Unknown";

        // Shorten the URL
        const shortenedUrl = await shortenURL(videoUrl);

        // Download the video to cache
        const videoId = randomString(10);
        const videoPath = path.join(__dirname, "cache", ${videoId}.mp4);

        const writer = fs.createWriteStream(videoPath);
        const videoResponse = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        videoResponse.data.pipe(writer);

        writer.on('finish', () => {
            const videoStream = fs.createReadStream(videoPath);
            message.reply({ 
                body: 🎬 Shoti Video\n📹 Title: ${title}\n👤 User: ${displayname} (@${username})\n🔗 Link: ${shortenedUrl}, 
                attachment: videoStream 
            });
            api.setMessageReaction("✅", event.messageID, () => {}, true);

            // Clean up cache file after sending
            setTimeout(() => {
                fs.unlink(videoPath, (err) => {
                    if (err) console.error("Error deleting cache file:", err);
                });
            }, 5000);
        });

        writer.on('error', (error) => {
            console.error("Download error:", error);
            message.reply("Error downloading the video. Here's the link instead:\n" + shortenedUrl);
            api.setMessageReaction("✅", event.messageID, () => {}, true);
        });

    } catch (error) {
        console.error("Error fetching shoti video:", error);
        message.reply("Failed to fetch shoti video. Please try again later.");
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

module.exports = {
    config: {
        name: "shoti",
        version: "1.0",
        author: "Ry",
        countDown: 5,
        role: 0,
        shortDescription: "Get random shoti video",
        longDescription: "Get a random shoti video from Hiroshi API",
        category: "random",
        guide: "{p}shoti"
    },
    onStart: function ({ api, event, args, message }) {
        return shotiVideo(api, event, args, message);
    }
};
