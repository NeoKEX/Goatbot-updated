const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bonk",
    version: "1.0.0",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Bonk someone"
    },
    longDescription: {
      en: "Create a bonk canvas with target and your PFP"
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
      let targetID;

      if (event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
      ) {
        targetID = Object.keys(event.mentions)[0];
      } else {
        return api.sendMessage(
          "👤 Please reply to or mention someone.",
          event.threadID,
          event.messageID
        );
      }

      const userInfo = await api
        .getUserInfoV2(targetID)
        .catch(() => null);

      const targetUser =
        userInfo?.[targetID] ||
        userInfo?.data?.[targetID] ||
        userInfo?.data ||
        {};

      const targetName =
        targetUser.name ||
        `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() ||
        "Target";

      const token =
        "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

      const avatar1 =
        `https://graph.facebook.com/${targetID}/picture` +
        `?width=720&height=720` +
        `&access_token=${token}`;

      const avatar2 =
        `https://graph.facebook.com/${event.senderID}/picture` +
        `?width=720&height=720` +
        `&access_token=${token}`;

      const apiUrl =
        `https://toshiro-api-editz6t9.vercel.app/api/canvas/bonk` +
        `?avatar1=${encodeURIComponent(avatar1)}` +
        `&avatar2=${encodeURIComponent(avatar2)}`;

      filePath = path.join(
        cacheDir,
        `bonk_${Date.now()}.png`
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
        throw new Error("Empty response from Bonk API.");
      }

      await fs.writeFile(
        filePath,
        Buffer.from(response.data)
      );

      await api.sendMessage(
        {
          body: `🔨 Bonk!\n🎯 ${targetName}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error(
        "Bonk:",
        error.response?.status || error.message
      );

      await api.sendMessage(
        `❌ Failed to generate bonk canvas.\n\n${error.response?.status || error.message}`,
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