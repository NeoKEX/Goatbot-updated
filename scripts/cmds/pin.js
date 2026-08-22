const axios = require("axios");

module.exports = {
  config: {
    name: "pin",
    aliases: ["pinterest"],
    version: "2.0",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Search Pinterest Images"
    },
    longDescription: {
      en: "Search Pinterest images by keyword."
    },
    category: "search",
    guide: {
      en: "{pn} <keyword>\n{pn} <keyword> - <limit>\n\nExamples:\n{pn} Zoro\n{pn} Zoro - 10"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      const input = args.join(" ").trim();

      if (!input) {
        return message.reply(
          "❌ Please provide a keyword.\n\nExample:\npin Zoro\npin Zoro - 10"
        );
      }

      let keyword = input;
      let limit = 1;

      if (input.includes("-")) {
        const split = input.split("-");
        keyword = split[0].trim();
        limit = parseInt(split[1]) || 1;
      }

      if (limit < 1) limit = 1;
      if (limit > 20) limit = 20;

      const api = `https://toshiro-api-editz6t9.vercel.app/api/search/pin?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;

      const { data } = await axios.get(api);

      if (!data.success || !data.result?.preview?.length) {
        return message.reply("❌ No images found.");
      }

      const images = data.result.preview.slice(0, limit);
      const attachments = [];

      for (const url of images) {
        try {
          const img = await axios.get(url, {
            responseType: "stream"
          });

          attachments.push(img.data);
        } catch {}
      }

      if (!attachments.length) {
        return message.reply("❌ Failed to download images.");
      }

      return message.reply({
        body:
`📌 𝗣𝗶𝗻𝘁𝗲𝗿𝗲𝘀𝘁 𝗦𝗲𝗮𝗿𝗰𝗵

🔎 𝗞𝗲𝘆𝘄𝗼𝗿𝗱: ${data.keyword}
🖼️ 𝗥𝗲𝘀𝘂𝗹𝘁𝘀: ${attachments.length}/${data.total}`,
        attachment: attachments
      });

    } catch (err) {
      console.error(err.response?.data || err);
      return message.reply("❌ Failed to fetch Pinterest images.");
    }
  }
};