const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "metaai",
    aliases: ["meta", "llama"],
    version: "2.5pro",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Advanced Meta AI" },
    longDescription: { en: "Chat with Meta AI and edit/generate images." },
    category: "ai",
    guide: { en: "{pn} <prompt> or reply to an image" }
  },

  onStart: async function ({ message, args, event, api, commandName }) {
    const { type, messageReply } = event;
    let prompt = args.join(" ");
    let imageUrl = null;

    if (type === "message_reply" && messageReply.attachments?.length > 0) {
      if (messageReply.attachments[0].type === "photo") {
        imageUrl = messageReply.attachments[0].url;
      }
    }

    if (!prompt && !imageUrl) return message.reply("Please provide a prompt or reply to an image.");

    return this.handleMetaChat({ message, event, api, prompt, imageUrl, commandName, history: null });
  },

  onReply: async function ({ message, event, api, Reply, commandName }) {
    const prompt = event.body?.trim();
    if (!prompt) return;

    if (prompt.toLowerCase() === "clear") {
      api.setMessageReaction("🧹", event.messageID);
      return message.reply("Context cleared.");
    }

    const { attachments } = event;
    let imageUrl = (attachments?.length > 0 && attachments[0].type === "photo") ? attachments[0].url : null;

    return this.handleMetaChat({ 
      message, 
      event, 
      api, 
      prompt, 
      imageUrl, 
      commandName, 
      history: Reply.conversation_id 
    });
  },

  handleMetaChat: async function ({ message, event, api, prompt, imageUrl, commandName, history }) {
    api.setMessageReaction("⏳", event.messageID);
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const paths = [];

    try {
      const params = {
        message: prompt || "Analyze this image",
        new_conversation: history ? "false" : "true"
      };

      if (history) params.conversation_id = history;
      if (imageUrl) params.img_url = imageUrl;

      const response = await axios.get("https://metakexbyneokex.vercel.app/chat", { params });
      const { success, message: replyText, image_urls, conversation_id } = response.data;

      if (!success) throw new Error("API process failed");

      let sendData = { body: replyText };

      if (image_urls && image_urls.length > 0) {
        const attachment = [];
        for (let i = 0; i < image_urls.length; i++) {
          const imgPath = path.join(cacheDir, `meta_${Date.now()}_${i}.png`);
          const imgRes = await axios.get(image_urls[i], { responseType: "arraybuffer" });
          await fs.writeFile(imgPath, Buffer.from(imgRes.data));
          attachment.push(fs.createReadStream(imgPath));
          paths.push(imgPath);
        }
        sendData.attachment = attachment;
      }

      message.reply(sendData, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            conversation_id: conversation_id
          });
        }
        paths.forEach(p => fs.remove(p).catch(() => {}));
      });

      api.setMessageReaction("✅", event.messageID);

    } catch (error) {
      api.setMessageReaction("❌", event.messageID);
      message.reply(`❌ Error: ${error.message}`);
      paths.forEach(p => fs.remove(p).catch(() => {}));
    }
  }
};
