const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "punch",
    aliases: ["pnch"],
    version: "1.5",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    description: "🥊 Generate a punch image for sender and tagged user",
    category: "fun",
    guide: {
      en: "{pn} @tag or reply — Generate a punch image"
    }
  },

  langs: {
    en: {
      noTag: "Please tag someone or reply to their message 🥊",
      fail: "❌ | Couldn't generate punch image, please try again later."
    }
  },

  onStart: async function ({ event, message, usersData, getLang }) {
    const kickerID = event.senderID;
    let kickedID = Object.keys(event.mentions || {})[0];
    if (!kickedID && event.messageReply?.senderID) kickedID = event.messageReply.senderID;
    if (!kickedID) return message.reply(getLang("noTag"));

    try {
      // Get names
      const [kickerName, kickedName] = await Promise.all([
        usersData.getName(kickerID).catch(() => "Unknown"),
        usersData.getName(kickedID).catch(() => "Unknown")
      ]);

      // Get avatars
      const [kickerAvatarUrl, kickedAvatarUrl] = await Promise.all([
        usersData.getAvatarUrl(kickerID),
        usersData.getAvatarUrl(kickedID)
      ]);

      // Load images
      const [kickerAvatar, kickedAvatar, baseImage] = await Promise.all([
        loadImage(kickerAvatarUrl),
        loadImage(kickedAvatarUrl),
        loadImage("https://raw.githubusercontent.com/X-nil143/XGbal/refs/heads/main/Messenger_creation_25995716493353919.jpeg") // Reliable base image
      ]);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);

      // Draw circular avatars
      function drawCircleAvatar(avatar, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
      }

      // Avatar positions
      drawCircleAvatar(kickerAvatar, 1000, 50, 338); // sender
      drawCircleAvatar(kickedAvatar, 80, 572, 338); // tagged / reply

      // Save image
      const savePath = path.join(__dirname, "tmp");
      await fs.ensureDir(savePath);
      const imgPath = path.join(savePath, `${kickerID}_${kickedID}_punch.png`);
      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      const text = `🥊 ${kickerName} just punched ${kickedName}!`;
      await message.reply({
        body: text,
        attachment: fs.createReadStream(imgPath)
      });

      // Delete temp file after 5 seconds
      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 5000);

    } catch (err) {
      console.error("❌ Punch command error:", err);
      return message.reply(getLang("fail"));
    }
  }
};