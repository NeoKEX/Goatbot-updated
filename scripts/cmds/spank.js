const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "spank",
    aliases: ["spnk"],
    version: "1.2",
    author: "NC-TOSHIRO (rev by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "🍑 Spank image",
    longDescription: "Generate a spank image with tagged user",
    category: "fun",
    guide: "{pn} @tag or reply"
  },

  langs: {
    en: {
      noTag: "🍑 Please tag a user or reply to a message.",
      fail: "❌ | Failed to generate the spank image."
    }
  },

  onStart: async function ({ event, message, usersData, getLang }) {
    const senderID = event.senderID;

    let targetID = Object.keys(event.mentions || {})[0];
    if (!targetID && event.messageReply?.senderID) {
      targetID = event.messageReply.senderID;
    }

    if (!targetID) return message.reply(getLang("noTag"));

    try {
      const [senderName, targetName] = await Promise.all([
        usersData.getName(senderID).catch(() => "Unknown"),
        usersData.getName(targetID).catch(() => "Unknown")
      ]);

      const [senderAvatarUrl, targetAvatarUrl] = await Promise.all([
        usersData.getAvatarUrl(senderID),
        usersData.getAvatarUrl(targetID)
      ]);

      const [senderAvatar, targetAvatar, baseImage] = await Promise.all([
        loadImage(senderAvatarUrl),
        loadImage(targetAvatarUrl),
        loadImage(
          "https://raw.githubusercontent.com/bolanakiabal/Abalsjsjdk/refs/heads/main/src/Img/New%20Project%2060%20%5B3FCBC80%5D.png"
        )
      ]);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      const drawCircleAvatar = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      drawCircleAvatar(senderAvatar, 620, 440, 384);
      drawCircleAvatar(targetAvatar, 1506, 10, 384);

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const imgPath = path.join(tmpDir, `${senderID}_${targetID}_spank.png`);
      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      await message.reply({
        body: `🍑 ${senderName} just spanked ${targetName}!`,
        attachment: fs.createReadStream(imgPath)
      });

      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 5000);

    } catch (err) {
      console.error(err);
      return message.reply(getLang("fail"));
    }
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase() === "spank me") {
      return message.reply("🍑 Use the command with a tag or reply.");
    }
  }
};
