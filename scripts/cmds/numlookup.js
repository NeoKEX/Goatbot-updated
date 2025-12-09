const axios = require('axios');

module.exports = {
  config: {
    name: "numlookup",
    version: "1.0",
    author: "SiAM",
    countDown: 10,
    role: 0,
    category: "Utility",
    ShortDescription: "Looks up phone number information.",
    LongDescription: "Provides carrier and potential Facebook ID information for a given phone number.",
    guide: {
      en: "{pn} <phone_number_with_country_code>"
    }
  },

  onStart: async function ({ api, args, message, event }) {
    const { getPrefix, getStreamFromURL } = global.utils;
    const p = getPrefix(event.threadID);

    if (!args || args.length === 0) {
      return message.reply(
        `❌ Please provide a phone number with the country code.\n\nExample:\n${p}numlookup 8801838XXXXXX`
      );
    }

    const rawNumber = args.join("");
    const cleanedNumber = rawNumber.replace(/\D/g, '');

    if (!cleanedNumber) {
        return message.reply(
            `❌ Invalid number format. Please provide digits only, including the country code.\n\nExample:\n${p}numlookup 8801838XXXXXX`
        );
    }

    const apiKey = "gaysex";
    const apiURL = `https://connect-foxapi.onrender.com/tools/numlookup?apikey=${apiKey}&number=${cleanedNumber}`;

    message.reaction("⏳", event.messageID);

    try {
      const response = await axios.get(apiURL);

      if (response.status === 200 && response.data) {
        const { name, img, fb_id } = response.data;

        let body = `Number Lookup Results 📱\n\n`;
        body += `❏ Number: ${cleanedNumber}\n`;
        body += `❏ Name: ${name || "N/A"}\n`;
        body += `❏ Facebook ID: ${fb_id || "Not Found"}\n`;

        let attachmentStream = null;
        if (img) {
           attachmentStream = await getStreamFromURL(img);
        }

        await message.reply({
          body: body,
          ...(attachmentStream && { attachment: attachmentStream })
        });

        message.reaction("✅", event.messageID);

      } else {
         
         message.reply("❌ An unexpected issue occurred with the API response. Please try again.");
         message.reaction("❓", event.messageID);
      }

    } catch (error) {
      console.error("Numlookup API Error:", error);
      message.reaction("❌", event.messageID);

      if (error.response && error.response.status === 400) {
        message.reply(
          `❌ Invalid number or country code provided\nPlease ensure the number is correct and includes the country code (e.g., 880 for Bangladesh).\n without "+" sign\n\nExample:\n${p}numlookup 8801838XXXXXX`
        );
      } else {
        message.reply("❌ err.");
      }
    }
  }
};