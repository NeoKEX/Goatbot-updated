const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function getApiBase() {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/noobcore404/NoobCore/main/NCApiUrl.json");
    return res.data.apiv1;
  } catch (e) {
    console.error("GitHub API fetch error:", e.message);
    return null;
  }
}

async function toFont(text, id = 21) {
  try {
    const apiBase = await getApiBase();
    if (!apiBase) return text;
    const { data } = await axios.get(`${apiBase}/api/font?id=${id}&text=${encodeURIComponent(text)}`);
    return data.output || text;
  } catch (e) {
    console.error("Font API error:", e.message);
    return text;
  }
}

module.exports = {
  config: {
    name: "pair2",
    aliases: ["lovepair2", "match2"],
    author: "NC-Saim",
    team: "NoobCore",
    version: "2.0",
    role: 0,
    category: "love",
    shortDescription: "💘 Generate a love match between you and another group member",
    longDescription: "Calculates a love match based on gender, shows avatars, background, and love percentage.",
    guide: "{pn} — Use this command in a group to find a love match",
    atai: true
  },

  onStart: async ({ api, event, usersData }) => {
    try {
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData.name || "Unknown";

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find(u => u.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage("⚠️ Could not determine your gender. Please try again later.", event.threadID, event.messageID);
      }

      const myGender = myData.gender.toUpperCase();
      let matchCandidates = myGender === "MALE"
        ? users.filter(u => u.gender === "FEMALE" && u.id !== event.senderID)
        : users.filter(u => u.gender === "MALE" && u.id !== event.senderID);

      if (matchCandidates.length === 0) {
        return api.sendMessage("❌ No suitable match found in the group. Please try again later.", event.threadID, event.messageID);
      }

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      let matchName = selectedMatch.name || "Unknown";

      senderName = await toFont(senderName, 21);
      matchName = await toFont(matchName, 21);

      const avatar1 = `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720`;
      const avatar2 = `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720`;

      const apiBase = await getApiBase();
      if (!apiBase) {
        return api.sendMessage("❌ Failed to fetch API base. Please try again later.", event.threadID, event.messageID);
      }

      const apiUrl = `${apiBase}/api/pair2?avatar1=${encodeURIComponent(avatar1)}&avatar2=${encodeURIComponent(avatar2)}`;
      const outputPath = path.join(__dirname, "cache", `pair2_${Date.now()}.png`);
      await fs.ensureDir(path.dirname(outputPath));

      const imageRes = await axios.get(apiUrl, { responseType: "arraybuffer" });
      await fs.writeFile(outputPath, Buffer.from(imageRes.data, "binary"));

      const lovePercent = Math.floor(Math.random() * 31) + 70;

      const messageText = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞

🎀 ${senderName} ✨
🎀 ${matchName} ✨

🕊️ 𝓓𝓮𝓼𝓽𝓲𝓷𝔂 has written your names together 🌹  
May your bond last forever ✨

💘 Compatibility: ${lovePercent}% 💘`;

      api.sendMessage(
        { body: messageText, attachment: fs.createReadStream(outputPath) },
        event.threadID,
        () => fs.unlinkSync(outputPath),
        event.messageID
      );

    } catch (err) {
      console.error("❌ Pair2 command error:", err);
      api.sendMessage("❌ An error occurred while trying to find a match. Please try again later.", event.threadID, event.messageID);
    }
  }
};
