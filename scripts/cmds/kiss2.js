const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "kiss2",
    version: "3.5.0",
    author: "NC-XALMAN",
    role: 0,
    category: "love",
    shortDescription: "💋 Kiss someone using mention, reply, or UID",
    longDescription: "Generates a kiss image between you and another user using mention, reply, or UID input.",
    guide: "{pn} @mention | Reply to a message | {pn} [UID]",
    atai: true
  },

  onStart: async ({ api, event, args, usersData }) => {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    let targetID;
    if (event.type === "message_reply") targetID = messageReply.senderID;
    else if (Object.keys(mentions || {}).length > 0) targetID = Object.keys(mentions)[0];
    else if (args[0]) targetID = args[0];

    if (!targetID) return api.sendMessage("❌ Please mention someone, reply to a message, or provide a UID! 🌧️", threadID, messageID);

    try {
      const [senderInfo, targetInfo] = await Promise.all([
        usersData.get(senderID),
        usersData.get(targetID)
      ]);

      const senderName = senderInfo.name || "Unknown";
      const targetName = targetInfo.name || "Unknown";
      const senderGender = senderInfo.gender; // 1 = Female, 2 = Male

      const backgroundUrl = "https://i.ibb.co/jjhvv0j/74e00c6d62a7.jpg";
      const avatarSenderUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

      const [bgImg, avatarSender, avatarTarget] = await Promise.all([
        loadImage(backgroundUrl),
        loadImage(avatarSenderUrl),
        loadImage(avatarTargetUrl)
      ]);

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const senderPos = senderGender === 2 ? { x: 240, y: 190, r: 40 } : { x: 320, y: 250, r: 40 };
      const targetPos = senderGender === 2 ? { x: 320, y: 250, r: 40 } : { x: 240, y: 190, r: 40 };

      const drawCircleAvatar = (img, pos) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, pos.x - pos.r, pos.y - pos.r, pos.r * 2, pos.r * 2);
        ctx.restore();
      };

      drawCircleAvatar(avatarSender, senderPos);
      drawCircleAvatar(avatarTarget, targetPos);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const imgPath = path.join(cacheDir, `kiss_${Date.now()}.png`);
      await fs.writeFile(imgPath, canvas.toBuffer());

      await api.sendMessage(
        {
          body: `💋 ${senderName} kissed ${targetName}!`,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        },
        messageID
      );

    } catch (err) {
      console.error("❌ Kiss2 command error:", err);
      return api.sendMessage("❌ An error occurred while generating the kiss image.", threadID, messageID);
    }
  }
};
