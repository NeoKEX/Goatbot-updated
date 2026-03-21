const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const FBCOVER_API_URL = 'https://nexalo-api.vercel.app/api/fb-cover';

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports = {
  config: {
    name: "fbcover1",
    aliases: [],
    version: "1.2",
    author: "Hridoy",
    countDown: 5,
    adminOnly: false,
    category: "media", // REQUIRED
    description: "Generate a Facebook cover image with custom text1 and text2 using your profile picture",
    guide: "{pn}fbcover1 [text1 text2] - Generate a Facebook cover using your profile picture",
    usePrefix: true
  },

  ncStart: async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    try {
      const textArgs = args.join(' ').trim();
      if (!textArgs) {
        return api.sendMessage("⚠️ Please provide two words: text1 and text2", threadID, messageID);
      }

      const [text1, ...rest] = textArgs.split(' ');
      const text2 = rest.join(' ');

      if (!text1 || !text2) {
        return api.sendMessage("⚠️ You must provide both text1 and text2", threadID, messageID);
      }

      const profilePicUrl = getProfilePictureURL(senderID);
      const apiUrl = `${FBCOVER_API_URL}?firstName=${encodeURIComponent(text1)}&lastName=${encodeURIComponent(text2)}&imageUrl=${encodeURIComponent(profilePicUrl)}`;

      // Temp file
      const tempDir = path.join(__dirname, '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const fileName = `fbcover_${crypto.randomBytes(8).toString('hex')}.png`;
      const filePath = path.join(tempDir, fileName);

      const response = await axios.get(apiUrl, { responseType: 'stream', timeout: 10000 });

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) throw new Error("API response is not an image");

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      if (fs.statSync(filePath).size === 0) throw new Error("Downloaded Facebook cover image is empty");

      await new Promise((resolve, reject) => {
        api.sendMessage({
          body: `🎨 Facebook cover generated successfully for you!\nText1: ${text1}, Text2: ${text2}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, (err) => {
          if (err) return reject(err);
          resolve();
        }, messageID);
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("[FbCover1 Error]", err.message);
      api.sendMessage(`⚠️ Error: ${err.message}`, threadID, messageID);
    }
  }
};
