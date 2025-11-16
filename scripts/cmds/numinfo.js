const axios = require("axios");

const API_KEY_FOX = "gaysex";

module.exports = {
  config: {
    name: "numinfo",
    aliases: ["numberinfo", "phonelookup"],
    version: "1.2",
    author: "NeoKEX",
    countDown: 5,
    role: 0,
    description: {
      en: "Get detailed phone number information from different APIs. Usage: /numinfo <api number> <phone number>"
    },
    category: "info",
    guide: {
      en: "{pn} <api number> <phone number>\nExample:\n/numinfo 1 019xxxxxxxx\n/numinfo 2 017xxxxxxxx"
    }
  },

  onStart: async function ({ event, args, message }) {
    const apiSelect = args[0];
    const inputNumber = args[1];
    if (!apiSelect || !inputNumber) 
      return message.reply("❌ | Provide API number and phone number.\nExample: /numinfo 1 019xxxxxxxx");

    const fullNumber = formatBDNumber(inputNumber);
    if (!fullNumber) 
      return message.reply("❌ | Invalid number format.\nProvide Bangladeshi number like 019xxxxxxxx or +8801xxxxxxxx");

    await message.reaction("⏳", event.messageID);

    try {
      let result;
      if (apiSelect === "1")
        result = await fetchNoobsAPI(fullNumber);
      else if (apiSelect === "2")
        result = await fetchFoxAPI(fullNumber);
      else
        return message.reply("❌ | Invalid API selection. Use 1 or 2.");

      if (typeof result === "string") {
        return message.reply(result);
      }
      await message.reply(result);
    } catch (err) {
      console.error(err);
      message.reply("❌ | Error fetching number info.\n" + err.message);
    }
  }
};

function formatBDNumber(inputNumber) {
  if (!inputNumber) return null;
  let num = inputNumber.replace(/[-\s]/g, "");
  if (num.startsWith("+880")) num = num.slice(1);
  else if (num.startsWith("880")) num = num;
  else if (num.startsWith("0")) num = "88" + num;
  else if (num.startsWith("1")) num = "880" + num;
  else return null;
  return num;
}

async function fetchNoobsAPI(fullNumber) {
  try {
    const { data } = await axios.get(`https://www.noobs-api.top/dipto/numinfov2?number=${fullNumber}`);
    if (!data.info || data.info.length === 0)
      return "❌ | No information found for this number.";

    const infoData = data.info.find(i => i.phones?.length) || data.info[1] || data.info[0] || {};
    const phoneInfo = infoData.phones ? infoData.phones[0] : {};
    const addressInfo = infoData.addresses ? infoData.addresses[0] : {};

    let msgText = `📞 𝗡𝘂𝗺𝗯𝗲𝗿 𝗜𝗻𝗳𝗼 (NoobsAPI):\n━━━━━━━━━━━━━━━\n`;
    msgText += `👤 Name: ${infoData.name || "Unknown"}\n`;
    msgText += `🔓 Access: ${infoData.access || "N/A"}\n`;
    msgText += `⭐ Score: ${infoData.score || "N/A"}\n`;
    msgText += `✅ Enhanced: ${infoData.enhanced ? "Yes" : "No"}\n\n`;

    msgText += `📱 𝗣𝗵𝗼𝗻𝗲 𝗗𝗲𝘁𝗮𝗶𝗹𝘀:\n`;
    msgText += `• Format: ${phoneInfo.e164Format || "N/A"}\n`;
    msgText += `• National: ${phoneInfo.nationalFormat || "N/A"}\n`;
    msgText += `• Type: ${phoneInfo.numberType || "N/A"}\n`;
    msgText += `• Carrier: ${phoneInfo.carrier || "N/A"}\n`;
    msgText += `• Country Code: ${phoneInfo.countryCode || "N/A"}\n\n`;

    msgText += `🌎 𝗔𝗱𝗱𝗿𝗲𝘀𝘀:\n`;
    msgText += `• Country: ${addressInfo.countryCode || "N/A"}\n`;
    msgText += `• Timezone: ${addressInfo.timeZone || "N/A"}\n\n`;

    msgText += `💬 𝗦𝗼𝗰𝗶𝗮𝗹𝘀:\n`;
    msgText += `• WhatsApp: ${data.whatsapp || "Not Found"}\n`;
    msgText += `• Telegram: ${data.telegram || "Not Found"}\n\n`;

    const attachments = data.image && data.image.length
      ? await Promise.all(data.image.map(url => global.utils.getStreamFromURL(url)))
      : [];

    return { body: msgText, attachment: attachments };
  } catch (err) {
    console.error(err);
    return `❌ | Failed to fetch number info from NoobsAPI.\n${err.message}`;
  }
}

async function fetchFoxAPI(fullNumber) {
  try {
    const cleanedNumber = "+88" + fullNumber;
    const apiURL = `https://connect-foxapi.onrender.com/tools/numlookup?apikey=${API_KEY_FOX}&number=${cleanedNumber}`;
    const response = await axios.get(apiURL);

    if (response.status === 200 && response.data) {
      const { name, img, fb_id } = response.data;
      let msgText = `📞 𝗡𝘂𝗺𝗯𝗲𝗿 𝗜𝗻𝗳𝗼 (FoxAPI)\n━━━━━━━━━━━━━━━\n`;
      msgText += `👤 Name: ${name || "Unknown"}\n`;
      msgText += `🔗 Facebook ID: ${fb_id || "N/A"}\n\n`;

      const attachment = img ? await global.utils.getStreamFromURL(img) : null;
      return { body: msgText, attachment: attachment ? [attachment] : [] };
    } else {
      return "❌ | No data found from FoxAPI.";
    }
  } catch (err) {
    console.error(err);
    return `❌ | Failed to fetch number info from FoxAPI.\n${err.message}`;
  }
}