const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "snews",
    aliases: ["news"],
    version: "1.0.0",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Create news image"
    },
    longDescription: {
      en: "Create a news-style image using target user's PFP"
    },
    category: "fun",
    guide: {
      en: "{pn} @mention name - headline\n{pn} (reply) name - headline"
    }
  },

  onStart: async function ({ api, event, args }) {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    let filePath;

    try {
      let uid;

      if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
      ) {
        uid = Object.keys(event.mentions)[0];
      } else if (event.messageReply?.senderID) {
        uid = event.messageReply.senderID;
      } else {
        return api.sendMessage(
          "📰 Please mention or reply to a user.",
          event.threadID,
          event.messageID
        );
      }

      const text = args.join(" ").trim();

      if (!text.includes("-")) {
        return api.sendMessage(
          "📰 Use: snews @mention name - headline",
          event.threadID,
          event.messageID
        );
      }

      const parts = text.split("-");

      const name = parts.shift().trim();
      const headline = parts.join("-").trim();

      if (!name || !headline) {
        return api.sendMessage(
          "📰 Use: snews @mention name - headline",
          event.threadID,
          event.messageID
        );
      }

      const token =
        "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

      const pfp =
        `https://graph.facebook.com/${uid}/picture` +
        `?width=720&height=720` +
        `&access_token=${token}`;

      const bg = pfp;

      const apiUrl =
        `https://toshiro-api-editz6t9.vercel.app/api/canvas/snews` +
        `?headline=${encodeURIComponent(headline)}` +
        `&name=${encodeURIComponent(name)}` +
        `&pfp=${encodeURIComponent(pfp)}` +
        `&bg=${encodeURIComponent(bg)}`;

      filePath = path.join(
        cacheDir,
        `snews_${uid}_${Date.now()}.png`
      );

      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "image/png,image/jpeg,image/*,*/*"
        }
      });

      if (!response.data) {
        throw new Error("Empty response from SNews API.");
      }

      await fs.writeFile(
        filePath,
        Buffer.from(response.data)
      );

      await api.sendMessage(
        {
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error(
        "SNEWS:",
        error.response?.status || error.message
      );

      await api.sendMessage(
        `❌ Failed to generate news image.\n\n${error.response?.status || error.message}`,
        event.threadID,
        event.messageID
      );

    } finally {
      if (
        filePath &&
        await fs.pathExists(filePath)
      ) {
        await fs.remove(filePath).catch(() => {});
      }
    }
  }
};