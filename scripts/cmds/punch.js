const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "punch",
    aliases: ["pnch"],
    version: "1.5",
    author: "NC-TOSHIRO (rev by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "🥊 Punch image",
    longDescription: "Generate a punch image for sender and tagged user",
    category: "fun",
    guide: "{pn} @tag or reply"
  },

  langs: {
    en: {
      noTag: "🥊 Please tag someone or reply to their message.",
      fail: "❌ | Couldn't generate punch image, please try again later."
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
        loadImage("https://raw.githubusercontent.com/X-nil143/XGbal/refs/heads/main/Messenger_creation_25995716493353919.jpeg")
      ]);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      // draw background
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // circle avatar helper
      const drawCircleAvatar = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      // positions
      drawCircleAvatar(senderAvatar, 1000, 50, 338);
      drawCircleAvatar(targetAvatar, 80, 572, 338);

      // save
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const imgPath = path.join(tmpDir, `${senderID}_${targetID}_punch.png`);
      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      await message.reply({
        body: `🥊 ${senderName} just punched ${targetName}!`,
        attachment: fs.createReadStream(imgPath)
      });

      // cleanup
      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 5000);

    } catch (err) {
      console.error("PUNCH ERROR:", err);
      return message.reply(getLang("fail"));
    }
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase() === "punch me") {
      return message.reply("🥊 Tag someone or reply to use this command.");
    }
  }
};
