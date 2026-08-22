const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: { name: "trash", author: "Toshiro Editz", category: "fun", role: 0 },

  onStart: async ({ event, message }) => {
    const uid = Object.keys(event.mentions)[0] || event.senderID;
    const url =
      `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const res = await axios.get(url, { responseType: "arraybuffer" });
    const img = await new DIG.Trash().getImage(Buffer.from(res.data));

    const out = `${__dirname}/cache/${uid}_trash.png`;
    await fs.ensureDir(`${__dirname}/cache`);
    await fs.writeFile(out, img);

    message.reply({ attachment: fs.createReadStream(out) },
      () => fs.unlinkSync(out));
  }
};