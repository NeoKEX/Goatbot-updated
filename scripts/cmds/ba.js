module.exports = {
  config: {
    name: "bat",
    version: "1.0",
    author: "VincentSenseo",
    countDown: 5,
    role: 0,
    description: {
      vi: "Tạo logo Blue Archive",
      en: "Create Blue Archive logo"
    },
    category: "image",
    guide: {
      vi: "   {pn} textL | textR",
      en: "   {pn} textL | textR"
    }
  },

  onStart: async function ({ message, args }) {
    const text = args.join(" ");
    if (!text) {
      return message.reply("Please provide text! Format: textL | textR\nExample: ba Hello | World");
    }

    let textL = "Blue";
    let textR = "Archive";

    if (text.includes("|")) {
      const parts = text.split("|");
      textL = parts[0].trim();
      textR = parts.slice(1).join("|").trim();
    } else {
      const parts = text.split(" ");
      textL = parts[0];
      textR = parts.slice(1).join(" ");
    }

    try {
      const { getStreamFromURL } = global.utils;
      const stream = await getStreamFromURL(`https://blue-archive-api-eyxa.vercel.app/api/generate?textL=${encodeURIComponent(textL)}&textR=${encodeURIComponent(textR)}`);
      stream.path = "ba.png";

      return message.reply({
        attachment: stream
      });
    } catch (e) {
      console.error("Error generating Blue Archive logo:", e);
      return message.reply("Failed to generate logo. Please try again later.");
    }
  }
};
