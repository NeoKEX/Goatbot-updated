const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "bro",
    aliases: ["bestie", "nakama"],
    version: "1.2",
    author: "TOSHIRO EDITZ",
    countDown: 5,
    role: 0,
    description: "🤝 Generate a nakama bond image",
    category: "fun",
    guide: {
      en: "{pn} @tag or reply — Create a bond image"
    }
  },

  langs: {
    en: {
      noTag: "Please tag a user or reply to a message 🤝",
      fail: "❌ | Failed to generate the bro image."
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
        usersData.getName(senderID).catch(() => "Bro"),
        usersData.getName(targetID).catch(() => "Nakama")
      ]);

      const [senderAvatarUrl, targetAvatarUrl] = await Promise.all([
        usersData.getAvatarUrl(senderID),
        usersData.getAvatarUrl(targetID)
      ]);

      // Using your provided Raw GitHub Link
      const bgURL = "https://raw.githubusercontent.com/Toshiro6t9/Bzsb/refs/heads/main/6f676d2d9ecbb564f42e08a0196832e5.jpg";

      const [senderAvatar, targetAvatar, baseImage] = await Promise.all([
        loadImage(senderAvatarUrl),
        loadImage(targetAvatarUrl),
        loadImage(bgURL)
      ]);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      // Draw the Wano background
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // Helper function for circular avatars with a white border
      const drawCircleAvatar = (avatar, x, y, size) => {
        ctx.save();
        // Add a slight shadow/glow for better visibility
        ctx.shadowBlur = 10;
        ctx.shadowColor = "black";
        
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
      };

      // Coordinates tuned for the Luffy/Zoro Wano image
      // senderAvatar (Luffy - Left)
      drawCircleAvatar(senderAvatar, 190, 60, 120);   
      
      // targetAvatar (Zoro - Right)
      drawCircleAvatar(targetAvatar, 400, 98, 120); 

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const imgPath = path.join(tmpDir, `bro_${senderID}_${targetID}.png`);
      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      await message.reply({
        body: `🤝 ${senderName} and ${targetName} are the ultimate DUO!`,
        attachment: fs.createReadStream(imgPath)
      });

      // Cleanup temp file
      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 8000);

    } catch (err) {
      console.error("Bro command error:", err);
      return message.reply(getLang("fail"));
    }
  }
};