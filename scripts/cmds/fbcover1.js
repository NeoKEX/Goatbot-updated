const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const GRAPH_API_BASE = "https://graph.facebook.com";
const FB_HARDCODED_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const FBCOVER1_API = "https://nexalo-api.vercel.app/api/fb-cover";

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports = {
  config: {
    name: "fbcover1",
    aliases: [],
    version: "1.0",
    author: "Hridoy",
    countDown: 5,
    adminOnly: false,
    description: "Generate a Facebook cover image with your profile picture (text1 & text2)",
    category: "Media",
    guide: "{pn}fbcover1 [text1 text2] - Generate a Facebook cover using your profile picture",
    usePrefix: true
  },

  ncStart: async function ({ message, event, args }) {
    const { threadID, senderID, messageID } = event;

    try {
      const textArgs = args.join(" ").trim();
      if (!textArgs) return message.reply("⚠️ Missing text1 and text2!");

      const [text1, ...rest] = textArgs.split(" ");
      const text2 = rest.join(" ");
      if (!text1 || !text2) return message.reply("⚠️ Both text1 and text2 are required!");

      const profilePicUrl = getProfilePictureURL(senderID);

      const apiUrl = `${FBCOVER1_API}?firstName=${encodeURIComponent(text1)}&lastName=${encodeURIComponent(text2)}&imageUrl=${encodeURIComponent(profilePicUrl)}`;

      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const fileName = `fbcover1_${crypto.randomBytes(8).toString("hex")}.png`;
      const filePath = path.join(tempDir, fileName);

      const response = await axios.get(apiUrl, { responseType: "stream", timeout: 10000 });
      if (!response.headers["content-type"]?.startsWith("image/")) throw new Error("API response is not an image");

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => writer.on("finish", resolve).on("error", reject));

      await message.reply({
        body: `🎨 Facebook cover generated successfully!`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);
      console.log(`[FbCover1] Generated for ${senderID} with text "${text1} ${text2}"`);
    } catch (err) {
      console.error("[FbCover1 Error]", err);
      return message.reply(`⚠️ Error: ${err.message}`);
    }
  }
};
