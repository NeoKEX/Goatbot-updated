const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const FBCOVER_API_URL = 'https://nexalo-api.vercel.app/api/facebook-cover-v2';

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports = {
  config: {
    name: "fbcover2",
    aliases: [],
    version: "1.0",
    author: "Hridoy",
    countDown: 5,
    role: 0,
    category: "media",
    description: "Generate a Facebook cover with profile picture and user details",
    guide: "{pn}fbcover2 [name lastname email phone location]\n{pn}fbcover2 @user [name lastname email phone location]"
  },

  ncStart: async function({ api, event, args, message }) {
    const { threadID, messageID, senderID, mentions } = event;

    try {
      const textArgs = args.join(' ').trim();
      if (!textArgs) {
        return message.reply("⚠️ Please provide name, lastname, email, phone, and location!");
      }

      const argsSplit = textArgs.split(' ');
      if (argsSplit.length < 5) {
        return message.reply("⚠️ You must provide all details: name, lastname, email, phone, and location!");
      }

      const [name, lastname, email, phone, ...locationArray] = argsSplit;
      const location = locationArray.join(' ');

      // Determine target user
      let targetID = senderID;
      let targetName = null;
      const mentionIDs = Object.keys(mentions || {});
      if (mentionIDs.length > 0) {
        targetID = mentionIDs[0];
        targetName = mentions[targetID].replace('@', '').trim();
      }

      // If not a mention, fetch sender name
      if (!targetName) {
        const userInfo = await new Promise((resolve, reject) => {
          api.getUserInfo([senderID], (err, info) => {
            if (err) reject(err);
            else resolve(info);
          });
        });
        targetName = userInfo[senderID]?.name || "Unknown User";
      }

      const profilePicUrl = getProfilePictureURL(targetID);
      const apiUrl = `${FBCOVER_API_URL}?image=${encodeURIComponent(profilePicUrl)}&name=${encodeURIComponent(name)}&lastname=${encodeURIComponent(lastname)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&location=${encodeURIComponent(location)}&style=1`;

      const tempDir = path.join(__dirname, '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const fileName = `fbcover2_${crypto.randomBytes(8).toString('hex')}.png`;
      const filePath = path.join(tempDir, fileName);

      const response = await axios.get(apiUrl, { responseType: 'stream', timeout: 10000 });
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) throw new Error("API response is not an image");

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });

      if (fs.statSync(filePath).size === 0) throw new Error("Downloaded Facebook cover image is empty");

      const msg = {
        body: `🎨 Facebook cover generated successfully for ${targetName}!`,
        attachment: fs.createReadStream(filePath)
      };

      if (targetID !== senderID) msg.mentions = [{ tag: `@${targetName}`, id: targetID }];

      await new Promise((resolve, reject) => {
        api.sendMessage(msg, threadID, (err) => { if (err) reject(err); else resolve(); }, messageID);
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("[FbCover2 Command Error]", err.message);
      message.reply(`⚠️ Error: ${err.message}`);
    }
  }
};
