const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slap",
    aliases: ["botslap"],
    version: "1.3",
    author: "NC-TOSHIRO (rev by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "😵 Batslap image",
    longDescription: "Create a batslap image using avatars",
    category: "fun",
    guide: "{pn} @mention"
  },

  langs: {
    en: {
      noTag: "❌ Please mention a user to slap.",
      fail: "❌ Batslap effect failed."
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    try {
      const senderID = event.senderID;
      let targetID = Object.keys(event.mentions || {})[0];

      // allow reply fallback (better UX)
      if (!targetID && event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      }

      if (!targetID) {
        return message.reply(getLang("noTag"));
      }

      const [senderAvatarURL, targetAvatarURL] = await Promise.all([
        usersData.getAvatarUrl(senderID),
        usersData.getAvatarUrl(targetID)
      ]);

      // Convert avatars to Buffer (required by DIG)
      const [senderBuffer, targetBuffer] = await Promise.all([
        axios
          .get(senderAvatarURL, { responseType: "arraybuffer" })
          .then(res => Buffer.from(res.data)),

        axios
          .get(targetAvatarURL, { responseType: "arraybuffer" })
          .then(res => Buffer.from(res.data))
      ]);

      // Generate batslap image
      const img = await new DIG.Batslap().getImage(
        senderBuffer,
        targetBuffer
      );

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const outPath = path.join(
        tmpDir,
        `${senderID}_${targetID}_batslap.png`
      );

      await fs.writeFile(outPath, img);

      const content = args.join(" ").trim();

      await message.reply(
        {
          body: content || "😵‍💫",
          attachment: fs.createReadStream(outPath)
        }
      );

      // cleanup
      setTimeout(() => {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }, 5000);

    } catch (err) {
      console.error("BATSLAP ERROR:", err);
      return message.reply(getLang("fail"));
    }
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase() === "slap me") {
      return message.reply("😵 Tag someone or reply to use this command.");
    }
  }
};
