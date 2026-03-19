const axios = require("axios");

module.exports = {
  config: {
    name: "midjourney",
    aliases: ["mj"],
    version: "2.5",
    author: "Neoaz 🐊",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Generate high-quality AI images" },
    longDescription: { en: "Generate AI images using Midjourney. Supports aspect ratios and image remix." },
    category: "graphics",
    guide: { en: "{pn} <prompt> --ar <16:9/9:16/etc> --model <1/2/3>" }
  },

  onStart: async function ({ message, args, event }) {
    let prompt = args.join(" ");
    if (!prompt && event.type !== "message_reply") return;

    message.reaction("⏳", event.messageID);

    let ratio = "1:1";
    let model = "Midjourney_6_1";
    let imageURL = "";

    if (prompt.includes("--ar")) {
      const arMatch = prompt.match(/--ar\s+(\d+:\d+)/);
      if (arMatch) {
        ratio = arMatch[1];
        prompt = prompt.replace(arMatch[0], "").trim();
      }
    }

    if (prompt.includes("--model")) {
      const modelMatch = prompt.match(/--model\s+(\d+)/);
      if (modelMatch) {
        const modelNum = modelMatch[1];
        if (modelNum === "1") model = "Midjourney_Niji_6";
        if (modelNum === "2") model = "Midjourney_6_1";
        if (modelNum === "3") model = "Midjourney_7";
        prompt = prompt.replace(modelMatch[0], "").trim();
      }
    }

    if (event.type === "message_reply") {
      const replyAttach = event.messageReply.attachments;
      if (replyAttach && replyAttach.length > 0 && (replyAttach[0].type === "photo" || replyAttach[0].type === "animated_image")) {
        imageURL = replyAttach[0].url;
      }
    }

    try {
      const res = await axios.get(`https://midjourney-pro.onrender.com/mj`, {
        params: {
          prompt: prompt || "highly detailed masterpiece",
          imageURL: imageURL,
          model: model,
          ratio: ratio
        }
      });

      const data = res.data;

      if (data.success && data.images && data.images.length > 0) {
        const imgStream = await global.utils.getStreamFromURL(data.images[0].final);

        return message.reply({
          body: `✅ 𝗠𝗝 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗶𝗼𝗻 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲\n🤖 𝗠𝗼𝗱𝗲𝗹: ${model}\n📐 𝗔𝘀𝗽𝗲𝗰𝘁 𝗥𝗮𝘁𝗶𝗼: ${ratio}`,
          attachment: imgStream
        });
      } else {
        message.reaction("❌", event.messageID);
      }

    } catch (err) {
      message.reaction("❌", event.messageID);
    }
  }
};