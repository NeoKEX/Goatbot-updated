const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");

const ANILIST_QUERY = `
  query ($search: String) {
    Media(search: $search, type: MANGA) {
      title { romaji english native }
      description(asHtml: false)
      status
      chapters
      volumes
      averageScore
      genres
      siteUrl
      coverImage { large }
    }
  }
`;

module.exports = {
  config: {
    name: "manga",
    aliases: ["man", "ani-manga"],
    version: "1.0",
    author: "VincentSensei",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search Manga info" },
    longDescription: { en: "Search Manga info using AniList API" },
    category: "anime",
    guide: { en: "{pn} [manga name] — get manga info from AniList" }
  },

  onStart: async function ({ message, event, args }) {
    const query = args.join(" ");
    if (!query) return message.reply("🔍 Please provide a manga name.");

    try {
      message.reaction("⏳", event.messageID);

      const res = await axios.post("https://graphql.anilist.co", {
        query: ANILIST_QUERY,
        variables: { search: query }
      }, { timeout: 15000 });

      const manga = res.data.data.Media;
      if (!manga) {
        message.reaction("❌", event.messageID);
        return message.reply("❌ No manga found. Try checking the name.");
      }

      const title = manga.title.english || manga.title.romaji || manga.title.native;
      const desc = manga.description
        ?.replace(/<br>/g, "\n")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .substring(0, 300) || "No description available.";

      const msg = `📖 ${title}

📌 Status: ${manga.status}
📚 Chapters: ${manga.chapters || "?"}
📘 Volumes: ${manga.volumes || "?"}
⭐ Score: ${manga.averageScore || "?"}/100
🎭 Genres: ${manga.genres.join(", ")}

📝 Description:
${desc}...

🔗 ${manga.siteUrl}`;

      const coverUrl = manga.coverImage?.large;
      if (!coverUrl) {
        message.reaction("✅", event.messageID);
        return message.reply(msg);
      }

      const imgData = await axios.get(coverUrl, { responseType: "arraybuffer", timeout: 15000 });
      const imgPath = path.join(os.tmpdir(), `manga_${Date.now()}.jpg`);
      await fs.writeFile(imgPath, Buffer.from(imgData.data));

      message.reaction("✅", event.messageID);

      await message.reply({
        body: msg,
        attachment: fs.createReadStream(imgPath)
      });

      fs.unlink(imgPath).catch(() => {});

    } catch (e) {
      console.error("[Manga] Error:", e.message);
      message.reaction("❌", event.messageID);
      message.reply("❌ Couldn't fetch manga info. Try again or check the name.");
    }
  }
};
