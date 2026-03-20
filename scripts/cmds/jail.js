const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "jail",
    version: "1.0",
    author: "NC-TOSHIRO",
    role: 0,
    category: "fun",
    shortDescription: "⛓ Apply jail effect to a user",
    longDescription: "Add a jail overlay effect to a user's avatar",
    guide: "{pn} [mention | reply | self]",
    atai: true
  },

  langs: {
    en: {
      fail: "❌ Jail effect failed",
      noUser: "❌ Please tag a user, reply, or use your own avatar"
    }
  },

  onStart: async ({ event, message, usersData, getLang }) => {
    try {
      const uid = event.messageReply
        ? event.messageReply.senderID
        : event.mentions && Object.keys(event.mentions).length
        ? Object.keys(event.mentions)[0]
        : event.senderID;

      if (!uid) return message.reply(getLang("noUser"));

      const avatarURL = await usersData.getAvatarUrl(uid);
      const buffer = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;

      const img = await new DIG.Jail().getImage(buffer);

      const outputPath = path.join(__dirname, "tmp", `${uid}_jail.png`);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, img);

      await message.reply(
        { attachment: fs.createReadStream(outputPath) },
        () => fs.unlinkSync(outputPath)
      );
    } catch (err) {
      console.error("Jail command error:", err);
      message.reply(getLang("fail"));
    }
  }
};
