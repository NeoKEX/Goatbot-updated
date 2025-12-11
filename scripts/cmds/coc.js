const axios = require("axios");

module.exports = {
  config: {
    name: "coc",
    aliases: ["findbase"],
    author: "S M Fahim",
    version: "1.2",
    role: 0,
    longDescription: "Find Clash Of Clans base info from image",
    category: "game"
  },

  onStart: async function ({ message, event }) {
    try {
      if (!event.messageReply?.attachments?.[0])
        return message.reply("Please reply to a base image.");

      const img = encodeURIComponent(event.messageReply.attachments[0].url);
      const apiURL = `https://fahim-api-demo.onrender.com/info/coc/findthisbase?url=${img}`;

      message.reply("Searching base info...", async (err, info) => {
        try {
          const COOKIE = "connect.sid=s%3A7sKKv8NJgIs6k3gb4DVeDiPAQNr1cyUE.m%2BNmkn%2BHDCqttRUhpW5sm9vjshuCccz3nNSoC3FBQK8";

          const { data } = await axios.get(apiURL, {
            headers: { Cookie: COOKIE },
            withCredentials: true
          });

          if (!data?.results?.length) return message.reply("No results found.");

          const res = data.results[0];

          const text =
            `Found Base!\n\n` +
            `Match Rating: ${res.matchRating}%\n` +
            `Date Added: ${res.dateTimeAdded}\n` +
            `TownHall: ${res.extraInfo}\n\n` +
            `Attack: ${res.url}`;

          const attachments = [];

          if (res.baseImage)
            attachments.push(await global.utils.getStreamFromURL(res.baseImage, "base.png"));

          if (res.usedArmyImage)
            attachments.push(await global.utils.getStreamFromURL(res.usedArmyImage, "army.png"));

          await message.reply({
            body: text,
            attachment: attachments
          });

          message.unsend(info.messageID);

        } catch (e) {
          console.log(e.response?.data || e);
          message.reply("Error while processing.");
        }
      });

    } catch (e) {
      console.log(e);
      message.reply("Unknown error.");
    }
  }
};
