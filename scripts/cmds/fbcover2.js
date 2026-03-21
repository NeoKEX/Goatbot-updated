const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const GRAPH_API_BASE = "https://graph.facebook.com";
const FB_HARDCODED_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const FBCOVER2_API = "https://nexalo-api.vercel.app/api/facebook-cover-v2";

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
    adminOnly: false,
    description: "Generate a Facebook cover image with profile picture and full user details",
    category: "Media",
    guide:
      "{pn}fbcover2 [name lastname email phone location] - Generate a Facebook cover for yourself\n" +
      "{pn}fbcover2 @user [name lastname email phone location] - Generate a Facebook cover using a mentioned user",
    usePrefix: true
  },

  ncStart: async function ({ message, event, args, mentions }) {
    const { threadID, senderID, messageID } = event;

    try {
      if (!args.length) return message.reply("⚠️ Please provide all required details: name, lastname, email, phone, location!");

      // Extract details
      const [name, lastname, email, phone, ...locationArr] = args;
      if (!name || !lastname || !email || !phone || locationArr.length === 0)
        return message.reply("⚠️ You must provide: name, lastname, email, phone, location!");

      const location = locationArr.join(" ");

      // Determine target user (mention or sender)
      let targetID = senderID;
      let targetName = null;
      const mentionIDs = Object.keys(mentions || {});
      if (mentionIDs.length > 0) {
        targetID = mentionIDs[0];
        targetName = mentions[targetID].replace("@", "").trim();
      }

      // Fetch sender's name if needed
      if (!targetName) {
        const userInfo = await new Promise((resolve, reject) => {
          message.api.getUserInfo([senderID], (err, info) => err ? reject(err) : resolve(info));
        });
        targetName = userInfo[senderID]?.name || "Unknown User";
      }

      const profilePicUrl = getProfilePictureURL(targetID);

      const apiUrl = `${FBCOVER2_API}?image=${encodeURIComponent(profilePicUrl)}&name=${encodeURIComponent(name)}&lastname=${encodeURIComponent(lastname)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&location=${encodeURIComponent(location)}&style=1`;

      // Temp file path
      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const fileName = `fbcover2_${crypto.randomBytes(8).toString("hex")}.png`;
      const filePath = path.join(tempDir, fileName);

      // Download the image
      const response = await axios.get(apiUrl, { responseType: "stream", timeout: 10000 });
      if (!response.headers["content-type"]?.startsWith("image/")) throw new Error("API response is not an image");

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => writer.on("finish", resolve).on("error", reject));

      // Construct message
      const msg = {
        body: `🎨 Facebook cover generated successfully for ${targetName}!`,
        attachment: fs.createReadStream(filePath)
      };

      // Add mention if needed
      if (targetID !== senderID) {
        msg.mentions = [{ tag: `@${targetName}`, id: targetID }];
      }

      await message.reply(msg);

      fs.unlinkSync(filePath);
      console.log(`[FbCover2] Generated cover for ${targetName} (${targetID})`);
    } catch (err) {
      console.error("[FbCover2 Error]", err);
      return message.reply(`⚠️ Error: ${err.message}`);
    }
  }
};
