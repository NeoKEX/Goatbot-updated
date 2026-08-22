const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "bro2",
    aliases: ["minebro", "bleachbro"],
    version: "1.0",
    author: "TOSHIRO EDIT",
    countDown: 5,
    role: 0,
    description: "💎 Generate a Minecraft-themed Bleach bro image",
    category: "fun",
    guide: {
      en: "{pn} @tag or reply — Generate the image"
    }
  },

  langs: {
    en: {
      noTag: "Please tag a user or reply to a message 💎",
      fail: "❌ | Failed to generate the image."
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
        usersData.getName(senderID).catch(() => "Bro1"),
        usersData.getName(targetID).catch(() => "Bro2")
      ]);

      const [senderAvatarUrl, targetAvatarUrl] = await Promise.all([
        usersData.getAvatarUrl(senderID),
        usersData.getAvatarUrl(targetID)
      ]);

      // Your requested raw GitHub link
      const bgURL = "https://raw.githubusercontent.com/Toshiro6t9/Bzsb/refs/heads/main/6f1cb6b55548f87bce35366f6e1363b1.jpg";

      const [senderAvatar, targetAvatar, baseImage] = await Promise.all([
        loadImage(senderAvatarUrl),
        loadImage(targetAvatarUrl),
        loadImage(bgURL)
      ]);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      // Draw Background
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // Function to draw circular avatars
      const drawCircleAvatar = (avatar, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
      };

      /**
       * COORDINATE GUIDE:
       * 1st Avatar (Left character - Bam): Positioned near Ichigo's head
       * 2nd Avatar (Right character - Dan): Positioned near Urahara's head
       */
      drawCircleAvatar(senderAvatar, 488, 299, 110); // Ichigo (Left)
      drawCircleAvatar(targetAvatar, 170, 285, 110); // Urahara (Right)

      // Temp file handling
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);
      const imgPath = path.join(tmpDir, `bro2_${Date.now()}.png`);

      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      await message.reply({
        body: `💎 ${senderName} and ${targetName} are mining through life together!`,
        attachment: fs.createReadStream(imgPath)
      });

      // Auto delete
      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 10000);

    } catch (err) {
      console.error("Bro2 command error:", err);
      return message.reply(getLang("fail"));
    }
  }
};