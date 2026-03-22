const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

const GRAPH_API_BASE = "https://graph.facebook.com";
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const FBCOVER_API = "https://nexalo-api.vercel.app/api/fb-cover";

function getProfilePictureURL(uid, size = 512) {
  return `${GRAPH_API_BASE}/${uid}/picture?width=${size}&height=${size}&access_token=${FB_TOKEN}`;
}

module.exports = {
  config: {
    name: "fbcover",
    aliases: ["coverfb"],
    version: "2.0",
    author: "Hridoy + revised by ChatGPT",
    countDown: 5,
    role: 0,
    description: {
      en: "Generate Facebook cover using your profile picture"
    },
    category: "image",
    guide: {
      en: "{pn} <text1> | <text2>\nExample: {pn} Zaevii | Designer"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    try {
      // JOIN ARGUMENTS
      const input = args.join(" ");
      if (!input.includes("|")) {
        return api.sendMessage(
          "⚠️ Please use this format:\nfbcover <text1> | <text2>",
          threadID,
          messageID
        );
      }

      const [text1, text2] = input.split("|").map(t => t.trim());

      if (!text1 || !text2) {
        return api.sendMessage(
          "⚠️ Both text1 and text2 are required!",
          threadID,
          messageID
        );
      }

      // GET PROFILE PIC
      const avatar = getProfilePictureURL(senderID);

      // API URL
      const apiUrl = `${FBCOVER_API}?firstName=${encodeURIComponent(text1)}&lastName=${encodeURIComponent(text2)}&imageUrl=${encodeURIComponent(avatar)}`;

      // TEMP FILE
      const tempPath = path.join(__dirname, "cache");
      await fs.ensureDir(tempPath);

      const fileName = `fbcover_${crypto.randomBytes(6).toString("hex")}.png`;
      const filePath = path.join(tempPath, fileName);

      // FETCH IMAGE
      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 15000
      });

      if (!res.headers["content-type"]?.includes("image")) {
        throw new Error("Invalid image response from API");
      }

      fs.writeFileSync(filePath, res.data);

      // SEND RESULT
      await api.sendMessage(
        {
          body: "🎨 Your Facebook cover is ready!",
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );

    } catch (err) {
      console.error("[FBCOVER ERROR]", err.message);

      return api.sendMessage(
        "❌ Failed to generate cover. Try again later.",
        threadID,
        messageID
      );
    }
  }
};const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

const GRAPH_API_BASE = "https://graph.facebook.com";
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const FBCOVER_API = "https://nexalo-api.vercel.app/api/fb-cover";

function getProfilePictureURL(uid, size = 512) {
  return `${GRAPH_API_BASE}/${uid}/picture?width=${size}&height=${size}&access_token=${FB_TOKEN}`;
}

module.exports = {
  config: {
    name: "fbcover",
    aliases: ["coverfb"],
    version: "2.0",
    author: "Hridoy + revised by ChatGPT",
    countDown: 5,
    role: 0,
    description: {
      en: "Generate Facebook cover using your profile picture"
    },
    category: "image",
    guide: {
      en: "{pn} <text1> | <text2>\nExample: {pn} Zaevii | Designer"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    try {
      // JOIN ARGUMENTS
      const input = args.join(" ");
      if (!input.includes("|")) {
        return api.sendMessage(
          "⚠️ Please use this format:\nfbcover <text1> | <text2>",
          threadID,
          messageID
        );
      }

      const [text1, text2] = input.split("|").map(t => t.trim());

      if (!text1 || !text2) {
        return api.sendMessage(
          "⚠️ Both text1 and text2 are required!",
          threadID,
          messageID
        );
      }

      // GET PROFILE PIC
      const avatar = getProfilePictureURL(senderID);

      // API URL
      const apiUrl = `${FBCOVER_API}?firstName=${encodeURIComponent(text1)}&lastName=${encodeURIComponent(text2)}&imageUrl=${encodeURIComponent(avatar)}`;

      // TEMP FILE
      const tempPath = path.join(__dirname, "cache");
      await fs.ensureDir(tempPath);

      const fileName = `fbcover_${crypto.randomBytes(6).toString("hex")}.png`;
      const filePath = path.join(tempPath, fileName);

      // FETCH IMAGE
      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 15000
      });

      if (!res.headers["content-type"]?.includes("image")) {
        throw new Error("Invalid image response from API");
      }

      fs.writeFileSync(filePath, res.data);

      // SEND RESULT
      await api.sendMessage(
        {
          body: "🎨 Your Facebook cover is ready!",
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );

    } catch (err) {
      console.error("[FBCOVER ERROR]", err.message);

      return api.sendMessage(
        "❌ Failed to generate cover. Try again later.",
        threadID,
        messageID
      );
    }
  }
};
