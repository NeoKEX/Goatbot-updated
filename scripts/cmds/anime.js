const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");

module.exports = {
  config: {
    name: "anime",
    aliases: ["anipub", "watchanime"],
    version: "2.6",
    author: "VincentSensei",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search anime and get watch links" },
    longDescription: { en: "Search anime, get info and browse all episode links page by page." },
    category: "entertainment",
    guide: { en: "{pn} <anime name>" }
  },

  onStart: async function ({ message, args, event, commandName }) {
    const query = args.join(" ");
    if (!query) return message.reply("❌ Please provide an anime name.");

    message.reaction("🔍", event.messageID);

    try {
      const searchRes = await axios.get(`https://www.anipub.xyz/api/search/${encodeURIComponent(query)}`, {
        timeout: 15000
      });
      const results = searchRes.data;

      if (!results || results.length === 0) {
        message.reaction("❌", event.messageID);
        return message.reply("❌ No anime found with that name.");
      }

      let msg = "🔍 SEARCH RESULTS\n━━━━━━━━━━━━━━━━━━━━\n\n";
      results.slice(0, 10).forEach((item, index) => {
        msg += `${index + 1}. ${item.Name}\n`;
      });
      msg += "\n💬 Reply with a number to see details.";

      message.reaction("✅", event.messageID);

      const sentMsg = await message.reply(msg);
      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName,
        messageID: sentMsg.messageID,
        author: event.senderID,
        results: results.slice(0, 10),
        type: "selection"
      });

    } catch (err) {
      console.error("[Anime] Search error:", err.message);
      message.reaction("❌", event.messageID);
      message.reply("❌ Error fetching data from AniPub.");
    }
  },

  onReply: async function ({ message, event, Reply, commandName }) {
    if (event.senderID !== Reply.author) return;
    const input = event.body.trim().toLowerCase();

    try {
      if (Reply.type === "selection") {
        const index = parseInt(input) - 1;
        if (isNaN(index) || !Reply.results[index]) return message.reply("❌ Invalid selection.");

        const animeId = Reply.results[index].Id;
        message.reaction("⏳", event.messageID);

        const [infoRes, streamRes] = await Promise.all([
          axios.get(`https://www.anipub.xyz/anime/api/details/${animeId}`, { timeout: 15000 }),
          axios.get(`https://www.anipub.xyz/v1/api/details/${animeId}`, { timeout: 15000 })
        ]);

        const { local, jikan } = infoRes.data;
        const { local: streamData } = streamRes.data;

        const fixImg = p => p?.startsWith("http") ? p : `https://anipub.xyz/${p}`;
        const image = fixImg(local.ImagePath || local.Cover);

        let details = `🎬 ${local.Name.toUpperCase()}\n`;
        details += `━━━━━━━━━━━━━━━━━━━━\n`;
        details += `⭐ Score: ${local.MALScore || "N/A"}\n`;
        details += `📡 Status: ${local.Status}\n`;
        details += `🎞️ Episodes: ${local.epCount || "N/A"}\n`;
        details += `🎭 Genres: ${local.Genres?.join(", ") || "N/A"}\n\n`;
        details += `📝 Synopsis: ${jikan?.synopsis?.slice(0, 250)}...\n\n`;
        details += `💬 Reply with "watch" for episode links.`;

        // Download cover image using axios instead of getStreamFromURL
        let attachment;
        let tmpFile;
        try {
          tmpFile = path.join(os.tmpdir(), `anime_cover_${Date.now()}.jpg`);
          const imgRes = await axios.get(image, { responseType: "arraybuffer", timeout: 15000 });
          await fs.writeFile(tmpFile, Buffer.from(imgRes.data));
          attachment = fs.createReadStream(tmpFile);
        } catch (imgErr) {
          console.error("[Anime] Cover download failed:", imgErr.message);
        }

        const sentMsg = await message.reply({ body: details, attachment });
        if (tmpFile) fs.unlink(tmpFile).catch(() => {});

        message.reaction("✅", event.messageID);
        global.GoatBot.onReply.set(sentMsg.messageID, {
          commandName,
          messageID: sentMsg.messageID,
          author: event.senderID,
          streamData,
          currentPage: 0,
          type: "details"
        });

      } else if (Reply.type === "details" && (input === "watch" || input === "next")) {
        const { streamData, currentPage } = Reply;
        if (!streamData) return message.reply("❌ Episode links not available.");

        const cleanLink = l => l.replace("src=", "");
        const itemsPerPage = 15;

        const allEpisodes = [{ ep: 1, link: streamData.link }];
        if (streamData.ep) {
          streamData.ep.forEach((e, i) => allEpisodes.push({ ep: i + 2, link: e.link }));
        }

        const start = currentPage * itemsPerPage;
        const end = start + itemsPerPage;
        const pagedEpisodes = allEpisodes.slice(start, end);

        if (pagedEpisodes.length === 0) return message.reply("❌ No more episodes.");

        let links = `📺 ${streamData.name.toUpperCase()} — EPISODES\n`;
        links += `(Page: ${currentPage + 1})\n━━━━━━━━━━━━━━━━━━━━\n\n`;

        pagedEpisodes.forEach(e => {
          links += `▶️ Ep ${e.ep}: ${cleanLink(e.link)}\n`;
        });

        links += end < allEpisodes.length ? "\n💬 Reply with \"next\" for more." : "\n✅ End of list.";

        const sentMsg = await message.reply(links);
        global.GoatBot.onReply.set(sentMsg.messageID, {
          commandName,
          messageID: sentMsg.messageID,
          author: event.senderID,
          streamData,
          currentPage: currentPage + 1,
          type: "details"
        });
      }

    } catch (err) {
      console.error("[Anime] Reply error:", err.message);
      message.reply("❌ Request failed. Please try again.");
    }
  }
};
