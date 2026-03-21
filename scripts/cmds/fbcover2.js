const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const GRAPH_API_BASE = "https://graph.facebook.com";
const FB_HARDCODED_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const FBCOVER_API_URL = "https://nexalo-api.vercel.app/api/facebook-cover-v2";

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports.config = {
  name: "fbcover2",
  aliases: [],
  version: "1.0",
  author: "Hridoy",
  countDown: 5,
  adminOnly: false,
  description: "Generate a Facebook cover image with profile picture and user details",
  guide: "{pn}fbcover2 [name lastname email phone location] - Generate a cover using your profile picture\n{pn}fbcover2 @user [name lastname email phone location] - Generate a cover using a mentioned user's profile picture",
  usePrefix: true
};

module.exports.onStart = async function({ api, event, args, mentions }) {
  const { threadID, messageID, senderID } = event;

  try {
    const textArgs = args.join(" ").trim();
    if (!textArgs) return api.sendMessage("⚠️ Please provide name, lastname, email, phone, and location!", threadID, messageID);

    const splitArgs = textArgs.split(" ");
    if (splitArgs.length < 5) return api.sendMessage("⚠️ You must provide all details: name, lastname, email, phone, location!", threadID, messageID);

    const [name, lastname, email, phone, ...locationArray] = splitArgs;
    const location = locationArray.join(" ");

    // Determine target user
    let targetID = senderID;
    let targetName = null;
    const mentionIDs = Object.keys(mentions);
    if (mentionIDs.length > 0) {
      targetID = mentionIDs[0];
      targetName = mentions[targetID].replace("@", "").trim();
    }

    if (!targetName) {
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo([senderID], (err, info) => (err ? reject(err) : resolve(info)));
      });
      targetName = userInfo[senderID]?.name || "Unknown User";
    }

    const profilePicUrl = getProfilePictureURL(targetID);
    const apiUrl = `${FBCOVER_API_URL}?image=${encodeURIComponent(profilePicUrl)}&name=${encodeURIComponent(
      name
    )}&lastname=${encodeURIComponent(lastname)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&location=${encodeURIComponent(
      location
    )}&style=1`;

    const tempDir = path.join(__dirname, "..", "..", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const fileName = `fbcover2_${crypto.randomBytes(8).toString("hex")}.png`;
    const filePath = path.join(tempDir, fileName);

    const response = await axios.get(apiUrl, { responseType: "stream", timeout: 10000 });

    if (!response.headers["content-type"]?.startsWith("image/")) throw new Error("API response is not an image");

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const stats = fs.statSync(filePath);
    if (stats.size === 0) throw new Error("Downloaded Facebook cover image is empty");

    const msg = {
      body: `🎨 Facebook cover generated successfully for ${targetName}!`,
      attachment: fs.createReadStream(filePath)
    };

    if (targetID !== senderID) msg.mentions = [{ tag: `@${targetName}`, id: targetID }];

    await new Promise((resolve, reject) => {
      api.sendMessage(msg, threadID, (err) => {
        if (err) return reject(err);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        resolve();
      }, messageID);
    });
  } catch (err) {
    console.error("[FbCover2 Command Error]", err.message);
    api.sendMessage(`⚠️ Error generating Facebook cover: ${err.message}`, threadID, messageID);
  }
};
