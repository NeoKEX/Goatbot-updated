const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");

module.exports = {
  config: {
    name: "aniinfo",
    aliases: ["animeinfo", "a-info"],
    version: "1.0",
    author: "VincentSensei",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Get anime information" },
    longDescription: { en: "Get anime information using Jikan API" },
    category: "anime",
    guide: {
      en: "{pn} [anime name] — shows anime details using Jikan API"
    }
  },

  onStart: async function ({ message, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return message.reply("❗ Anime name missing. Try: aniinfo demon slayer");
    }

    try {
      message.reaction("⏳", event.messageID);

      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, {
        timeout: 15000
      });
      const anime = res.data.data[0];

      if (!anime) {
        message.reaction("❌", event.messageID);
        return message.reply("❌ No results found.");
      }

      const {
        title,
        title_english,
        type,
        episodes,
        status,
        score,
        aired,
        synopsis,
        images,
        genres,
        url
      } = anime;

      const msg = `🎬 Title: ${title_english || title}
📺 Type: ${type}
📊 Score: ${score || "?"}/10
📡 Status: ${status}
🎞️ Episodes: ${episodes || "?"}
📅 Aired: ${aired?.string || "?"}
🎭 Genres: ${genres.map(g => g.name).join(", ")}

📝 Description:
${synopsis?.substring(0, 400) || "No synopsis found."}...

🔗 ${url}`;

      const imageURL = images?.jpg?.large_image_url;
      if (!imageURL) {
        message.reaction("✅", event.messageID);
        return message.reply(msg);
      }

      const imgData = await axios.get(imageURL, { responseType: "arraybuffer", timeout: 15000 });
      const filePath = path.join(os.tmpdir(), `aniinfo_${Date.now()}.jpg`);
      await fs.writeFile(filePath, Buffer.from(imgData.data));

      message.reaction("✅", event.messageID);

      await message.reply({
        body: msg,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlink(filePath).catch(() => {});

    } catch (err) {
      console.error("[AniInfo] Error:", err.message);
      message.reaction("❌", event.messageID);
      message.reply("🚫 Error fetching anime data. Please try again.");
    }
  }
};
