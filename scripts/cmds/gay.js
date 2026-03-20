const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gay",
    version: "1.2",
    author: "NC-TOSHIRO (rev by ChatGPT)",
    countDown: 1,
    role: 0,
    shortDescription: "🌈 Rainbow effect",
    longDescription: "Apply rainbow overlay effect on avatar",
    category: "fun",
    guide: "{pn} @tag or reply (or none for yourself)"
  },

  langs: {
    en: {
      fail: "❌ Failed to apply effect."
    }
  },

  onStart: async function ({ event, message, usersData, getLang }) {
    try {
      let uid;

      // reply > mention > self (better UX flow)
      if (event.messageReply?.senderID) {
        uid = event.messageReply.senderID;
      } else if (Object.keys(event.mentions || {}).length > 0) {
        uid = Object.keys(event.mentions)[0];
      } else {
        uid = event.senderID;
      }

      const avatarURL = await usersData.getAvatarUrl(uid);

      const avatarBuffer = await axios
        .get(avatarURL, { responseType: "arraybuffer" })
        .then(res => Buffer.from(res.data));

      const img = await new DIG.Gay().getImage(avatarBuffer);

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const outPath = path.join(tmpDir, `${uid}_gay.png`);
      await fs.writeFile(outPath, img);

      await message.reply({
        attachment: fs.createReadStream(outPath)
      });

      // cleanup (safe delay)
      setTimeout(() => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, 5000);

    } catch (e) {
      console.error("GAY CMD ERROR:", e);
      return message.reply(getLang("fail"));
    }
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase() === "am i gay") {
      return message.reply("🌈 Try the command to find out 😏");
    }
  }
};
