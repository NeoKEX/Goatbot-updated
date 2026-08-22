const axios = require("axios");

module.exports = {
  config: {
    name: "lyrics",
    version: "3.2",
    author: "Toshiro Editz",
    role: 0,
    shortDescription: "Search song lyrics",
    category: "music"
  },

  onStart: async function ({ message, args, event }) {
    if (!args.length) {
      return message.reply("❌ | Please provide a song title.");
    }

    const title = args.join(" ");

    try {
      const res = await axios.get(
        "https://toshiro-editz-api.vercel.app/search/lyricsv2",
        { params: { title } }
      );

      const data = res.data?.data;
      if (!data || data.length === 0) {
        return message.reply("😢 | No lyrics found for this song.");
      }

      const options = data.slice(0, 3);

      let text = "╭── 🎶 LYRICS SEARCH ──╮\n│\n";
      options.forEach((s, i) => {
        text += `│ ${i + 1}️⃣  ${s.trackName}\n│    └─ ${s.artistName}\n│\n`;
      });
      text += "╰─ Reply: 1 / 2 / 3 ─╯";

      message.reply(text, (err, info) => {
        if (err) return;

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "lyrics",
          author: event.senderID,
          data: options,
          optionMsgID: info.messageID
        });
      });

    } catch (error) {
      console.error(error);
      message.reply("❌ | Failed to fetch lyrics. Please try again later.");
    }
  },

  onReply: async function ({ event, message, Reply, api }) {
    if (event.senderID !== Reply.author) return;

    const index = parseInt(event.body);
    if (isNaN(index) || index < 1 || index > 3) return;

    const song = Reply.data[index - 1];

    // 🔥 Auto delete option message
    api.unsendMessage(Reply.optionMsgID);

    if (!song.plainLyrics) {
      return message.reply("😢 | Lyrics not available.");
    }

    const lines = song.plainLyrics.split("\n");
    const chunkSize = 100;

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines
        .slice(i, i + chunkSize)
        .map(line => `│ ${line}`)
        .join("\n");

      const msg =
`╭── 📜 LYRICS ──╮
${chunk}
╰───────────╯`;

      await message.reply(msg);
    }
  }
};
