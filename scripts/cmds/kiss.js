const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "kiss",
    version: "1.0",
    author: "NC-SAIM",
    role: 0,
    category: "love",
    shortDescription: "💋 Generate a kiss image with a tagged user",
    longDescription: "Create a romantic kiss image between you and another user by tagging or replying.",
    guide: "{pn} @tag or reply — Generate kiss image 💋",
    atai: true
  },

  langs: {
    en: {
      noTag: "❌ Please tag someone or reply to their message to use this command 💋",
      fail: "❌ Could not generate kiss image, please try again later."
    }
  },

  onStart: async ({ event, message, usersData, getLang }) => {
    const uid1 = event.senderID;
    let uid2 = Object.keys(event.mentions || {})[0];
    if (!uid2 && event.messageReply?.senderID) uid2 = event.messageReply.senderID;
    if (!uid2) return message.reply(getLang("noTag"));

    try {
      const [name1, name2] = await Promise.all([
        usersData.getName(uid1).catch(() => "Unknown"),
        usersData.getName(uid2).catch(() => "Unknown")
      ]);

      const [avatar1, avatar2] = await Promise.all([
        usersData.getAvatarUrl(uid1),
        usersData.getAvatarUrl(uid2)
      ]);

      const apiBaseRes = await axios.get("https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json");
      const apiBase = apiBaseRes.data?.apiv1;
      if (!apiBase) return message.reply("❌ API base URL missing.");

      const apiURL = `${apiBase}/api/kiss?boy=${encodeURIComponent(avatar1)}&girl=${encodeURIComponent(avatar2)}`;
      const response = await axios.get(apiURL, { responseType: "arraybuffer" });

      const savePath = path.join(__dirname, "tmp");
      await fs.ensureDir(savePath);
      const imgPath = path.join(savePath, `${uid1}_${uid2}_kiss.jpg`);
      await fs.writeFile(imgPath, response.data);

      await message.reply({
        body: `💋 ${name1} just kissed ${name2}! ❤️`,
        attachment: fs.createReadStream(imgPath)
      });

      // Remove temp file after 5 seconds
      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 5000);

    } catch (err) {
      console.error("❌ Kiss command error:", err);
      return message.reply(getLang("fail"));
    }
  }
};
