const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "wanted2",
    version: "1.1",
    author: "NC-TOSHIRO (rev by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "😎 Wanted (DIG)",
    longDescription: "Generate a wanted poster using DIG",
    category: "fun",
    guide: "{pn} @tag or reply (or none for yourself)"
  },

  langs: {
    en: {
      fail: "❌ Wanted failed"
    }
  },

  onStart: async ({ event, message, usersData, getLang }) => {
    try {
      let uid;

      // mention > reply > self
      if (Object.keys(event.mentions || {}).length > 0) {
        uid = Object.keys(event.mentions)[0];
      } else if (event.messageReply?.senderID) {
        uid = event.messageReply.senderID;
      } else {
        uid = event.senderID;
      }

      const avatarURL = await usersData.getAvatarUrl(uid);

      const buffer = await axios
        .get(avatarURL, { responseType: "arraybuffer" })
        .then(res => Buffer.from(res.data));

      const img = await new DIG.Wanted().getImage(buffer);

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const filePath = path.join(tmpDir, `${uid}_wanted.png`);
      await fs.writeFile(filePath, img);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

      // cleanup (safe delay)
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 5000);

    } catch (err) {
      console.error("WANTED2 ERROR:", err);
      return message.reply(getLang("fail"));
    }
  },

  onChat: async ({ event, message }) => {
    if (event.body?.toLowerCase() === "i'm wanted") {
      return message.reply("😎 Run the command to generate your poster.");
    }
  }
};
