const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function getApiBase() {
  try {
    const apiUrl = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
    const res = await axios.get(apiUrl);
    return res.data.saimx69x;
  } catch (e) {
    console.error("API URL fetch error:", e.message);
    return null;
  }
}

async function toFont(text, id = 21) {
  try {
    const apiBase = await getApiBase();
    if (!apiBase) return text;
    const apiUrl = `${apiBase}/api/font?id=${id}&text=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl);
    return data.output || text;
  } catch (e) {
    console.error("Font API error:", e.message);
    return text;
  }
}

module.exports = {
  config: {
    name: "pair",
    aliases: ["lovepair", "match"],
    version: "2.0",
    author: "NC-Saimx69x",
    role: 0,
    shortDescription: "💘 Generate a love match with another group member",
    longDescription: "Calculates a love match based on gender, shows avatars, background, and love percentage.",
    guide: "{pn} — Use in a group to find a love match",
    atai: true,
    category: "love"
  },

  onStart: async ({ event, message, usersData, api }) => {
    try {
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData.name;

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find(u => u.id === event.senderID);
      if (!myData || !myData.gender) 
        return message.reply("⚠️ Could not determine your gender. Please try again later.");

      const myGender = myData.gender.toUpperCase();
      let matchCandidates = [];

      if (myGender === "MALE") matchCandidates = users.filter(u => u.gender === "FEMALE" && u.id !== event.senderID);
      else if (myGender === "FEMALE") matchCandidates = users.filter(u => u.gender === "MALE" && u.id !== event.senderID);
      else return message.reply("⚠️ Your gender is undefined. Cannot find a match.");

      if (matchCandidates.length === 0) return message.reply("❌ No suitable match found in the group.");

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      let matchName = selectedMatch.name;

      senderName = await toFont(senderName, 21);
      matchName = await toFont(matchName, 21);

      const avatar1 = `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatar2 = `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const apiBase = await getApiBase();
      if (!apiBase) return message.reply("❌ Failed to fetch API base. Please try again later.");

      const apiUrl = `${apiBase}/api/pair?avatar1=${encodeURIComponent(avatar1)}&avatar2=${encodeURIComponent(avatar2)}`;
      const outputPath = path.join(__dirname, "tmp", `pair_${event.senderID}_${selectedMatch.id}.png`);

      const imageRes = await axios.get(apiUrl, { responseType: "arraybuffer" });
      await fs.writeFile(outputPath, Buffer.from(imageRes.data, "binary"));

      const lovePercent = Math.floor(Math.random() * 31) + 70;

      const text = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞

🎀 ${senderName} ✨️
🎀 ${matchName} ✨️

🕊️ Destiny has written your names together 🌹
May your bond last forever ✨️

💘 Compatibility: ${lovePercent}% 💘`;

      await message.reply({ body: text, attachment: fs.createReadStream(outputPath) });
      fs.unlinkSync(outputPath);

    } catch (err) {
      console.error("Pair command error:", err);
      message.reply("❌ An error occurred while trying to find a match. Please try again later.");
    }
  }
};
