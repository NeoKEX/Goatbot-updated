const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "hug",
    version: "1.0",
    author: "NC-SAIM",
    role: 0,
    category: "love",
    shortDescription: "🤗 Generate a hug image with a tagged user",
    longDescription: "Creates a cute hug image between you and a tagged user or reply target.",
    guide: "{pn} @tag or reply — Generate hug image 🤗",
    atai: true
  },

  langs: {
    en: {
      noTag: "❌ Please tag someone or reply to their message to use this command 🤗",
      fail: "❌ Could not generate hug image, please try again later."
    }
  },

  onStart: async ({ event, message, usersData }) => {
    const uid1 = event.senderID;
    let uid2 = Object.keys(event.mentions || {})[0];
    if (!uid2 && event.messageReply?.senderID) uid2 = event.messageReply.senderID;
    if (!uid2) return message.reply("❌ Please tag someone or reply to their message to use this command 🤗");

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
      if (!apiBase) return message.reply("❌ Failed to fetch API base. Please try again later.");

      const apiURL = `${apiBase}/api/hug?boy=${encodeURIComponent(avatar1)}&girl=${encodeURIComponent(avatar2)}`;
      const response = await axios.get(apiURL, { responseType: "arraybuffer" });

      const savePath = path.join(__dirname, "tmp");
      await fs.ensureDir(savePath);
      const imgPath = path.join(savePath, `${uid1}_${uid2}_hug.jpg`);
      await fs.writeFile(imgPath, response.data);

      await message.reply({
        body: `🤗 ${name1} just hugged ${name2}! ❤️`,
        attachment: fs.createReadStream(imgPath)
      });

      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 5000);

    } catch (err) {
      console.error("❌ Hug command error:", err);
      return message.reply("❌ Could not generate hug image, please try again later.");
    }
  }
};
