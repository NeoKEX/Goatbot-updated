const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "jail",
    author: "Toshiro Editz",
    category: "fun",
    role: 0,
    countDown: 5
  },

  onStart: async ({ event, message }) => {
    try {
      let uid = event.senderID;
      if (event.messageReply) uid = event.messageReply.senderID;
      else if (Object.keys(event.mentions).length)
        uid = Object.keys(event.mentions)[0];

      const avatarURL =
        `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
      const img = await new DIG.Jail().getImage(Buffer.from(res.data));

      const out = path.join(__dirname, "cache", `${uid}_jail.png`);
      await fs.ensureDir(path.dirname(out));
      await fs.writeFile(out, img);

      message.reply({ attachment: fs.createReadStream(out) },
        () => fs.unlinkSync(out));

    } catch (e) {
      message.reply("❌ an error try again later");
    }
  }
};