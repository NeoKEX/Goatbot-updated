const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gay",
    version: "2.0.0",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Apply Gay overlay to PFP"
    },
    longDescription: {
      en: "Apply Gay overlay to a user's profile picture"
    },
    category: "fun",
    guide: {
      en: "{pn} @mention\n{pn} (reply to a user)"
    }
  },

  onStart: async function ({ api, event }) {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    let filePath;

    try {
      let uid = event.senderID;

      if (event.messageReply?.senderID) {
        uid = event.messageReply.senderID;
      } else if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
      ) {
        uid = Object.keys(event.mentions)[0];
      }

      if (!uid) {
        return api.sendMessage(
          "❌ User not found.",
          event.threadID,
          event.messageID
        );
      }

      const userInfo = await api
        .getUserInfoV2(uid)
        .catch(() => null);

      const user =
        userInfo?.[uid] ||
        userInfo?.data?.[uid] ||
        userInfo?.data ||
        {};

      const name =
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "User";

      const avatarURL =
        `https://graph.facebook.com/${uid}/picture` +
        `?width=720&height=720` +
        `&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const apiUrl =
        `https://toshiro-api-editz6t9.vercel.app/api/canvas/gay` +
        `?image=${encodeURIComponent(avatarURL)}`;

      filePath = path.join(
        cacheDir,
        `gay_${uid}_${Date.now()}.png`
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
        throw new Error("Empty response from canvas API.");
      }

      await fs.writeFile(
        filePath,
        Buffer.from(response.data)
      );

      await api.sendMessage(
        {
          body: `🏳️‍🌈 | Gay Canvas\n👤 ${name}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error(
        "Gay Canvas:",
        error.response?.status || error.message
      );

      await api.sendMessage(
        `❌ Failed to generate canvas.\n\n${error.response?.status || error.message}`,
        event.threadID,
        event.messageID
      );

    } finally {
      if (filePath && await fs.pathExists(filePath)) {
        await fs.remove(filePath).catch(() => {});
      }
    }
  }
};