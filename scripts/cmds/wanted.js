const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "wanted",
    version: "1.1",
    author: "𝑵𝑪-𝑺𝑨𝑰𝑴 (rev by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "😎 Wanted poster",
    longDescription: "Generate a wanted poster using avatar",
    category: "fun",
    guide: "{pn} @tag or reply (or none for yourself)"
  },

  langs: {
    en: {
      fail: "❌ Failed to generate wanted poster. Please try again later.",
      noApi: "❌ API base URL missing."
    }
  },

  onStart: async function ({ event, message, usersData, getLang }) {
    try {
      let targetID;

      // mention > reply > self
      if (Object.keys(event.mentions || {}).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else {
        targetID = event.senderID;
      }

      const [userName, avatarURL] = await Promise.all([
        usersData.getName(targetID).catch(() => "Unknown"),
        usersData.getAvatarUrl(targetID)
      ]);

      // fetch API base
      const apiBaseRes = await axios.get(
        "https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json"
      );

      const apiBase = apiBaseRes.data?.apiv1;
      if (!apiBase) return message.reply(getLang("noApi"));

      const apiURL = `${apiBase}/api/wanted?url=${encodeURIComponent(avatarURL)}`;

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const imgPath = path.join(tmpDir, `${targetID}_wanted.png`);

      const response = await axios.get(apiURL, {
        responseType: "arraybuffer"
      });

      await fs.writeFile(imgPath, response.data);

      await message.reply({
        body: `🎯 Target: ${userName}`,
        attachment: fs.createReadStream(imgPath)
      });

      // cleanup
      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 5000);

    } catch (err) {
      console.error("WANTED ERROR:", err);
      return message.reply(getLang("fail"));
    }
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase() === "i'm wanted") {
      return message.reply("😎 Use the command to see your poster.");
    }
  }
};
