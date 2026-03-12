const fs = require("fs-extra");
const axios = require("axios");
const os = require("os");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

const toEnglishName = (name) => {
  const map = {
    'আ': 'A', 'ই': 'I', 'উ': 'U', 'এ': 'E', 'ও': 'O',
    'ক': 'K', 'খ': 'Kh', 'গ': 'G', 'ঘ': 'Gh', 'ঙ': 'Ng',
    'চ': 'Ch', 'ছ': 'Chh', 'জ': 'J', 'ঝ': 'Jh', 'ঞ': 'Ny',
    'ট': 'T', 'ঠ': 'Th', 'ড': 'D', 'ঢ': 'Dh', 'ণ': 'N',
    'ত': 'T', 'থ': 'Th', 'দ': 'D', 'ধ': 'Dh', 'ন': 'N',
    'প': 'P', 'ফ': 'Ph', 'ব': 'B', 'ভ': 'Bh', 'ম': 'M',
    'য': 'Y', 'র': 'R', 'ল': 'L', 'শ': 'Sh', 'ষ': 'Sh', 'স': 'S', 'হ': 'H',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ে': 'e', 'ৈ': 'ai', 'ো': 'o', 'ৌ': 'au'
  };
  return name.split('').map(c => map[c] || c).join('').replace(/\s+/g, ' ').trim() || "Unknown";
};

function getCrime() {
  const crimes = [
    "Stealing Hearts", "Being Too Cool", "Spreading Chaos",
    "Hacking Laughter", "Breaking Rules", "Too Much Swag"
  ];
  return crimes[Math.floor(Math.random() * crimes.length)];
}

function getReward() {
  const rewards = [1000, 5000, 10000, 50000, 100000];
  return "$" + rewards[Math.floor(Math.random() * rewards.length)];
}

module.exports = {
  config: {
    name: "wanted",
    version: "1.1",
    author: "MOHAMMAD AKASH | Converted",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Wanted poster" },
    longDescription: { en: "Mention someone to create a high quality wanted poster." },
    category: "fun",
    guide: { en: "{pn} @mention" }
  },

  onStart: async function ({ event, message, usersData }) {
    try {
      const mentionID = Object.keys(event.mentions)[0];
      if (!mentionID) return message.reply("❌ Please mention someone to create their wanted poster!");

      message.reaction("⏳", event.messageID);

      const rawName = await usersData.getName(mentionID) || "User";
      const name = toEnglishName(rawName);

      // Use GoatBot's built-in avatar URL (no expired tokens needed)
      const photoUrl = await usersData.getAvatarUrl(mentionID);

      let res;
      try {
        res = await axios.get(photoUrl, {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: { "User-Agent": "Mozilla/5.0" }
        });
      } catch (avatarErr) {
        console.error("[Wanted] Avatar download failed:", avatarErr.message);
        return message.reply("❌ Could not download the user's profile picture.");
      }

      const avatarPath = path.join(os.tmpdir(), `wanted_avatar_${Date.now()}.jpg`);
      const outputPath = path.join(os.tmpdir(), `wanted_poster_${Date.now()}.jpg`);

      await fs.writeFile(avatarPath, Buffer.from(res.data));

      let avatar;
      try {
        avatar = await loadImage(avatarPath);
      } catch (imgErr) {
        console.error("[Wanted] Canvas loadImage failed:", imgErr.message);
        return message.reply("❌ Failed to load avatar image for the poster.");
      }

      const canvas = createCanvas(700, 900);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(0, 0, 700, 900);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 700, 150);

      ctx.font = "bold 100px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("WANTED", 350, 120);

      ctx.fillStyle = "#fff";
      ctx.fillRect(100, 180, 500, 500);
      ctx.save();
      ctx.beginPath();
      ctx.rect(100, 180, 500, 500);
      ctx.clip();
      ctx.drawImage(avatar, 100, 180, 500, 500);
      ctx.restore();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000";
      ctx.strokeRect(100, 180, 500, 500);

      ctx.font = "bold 50px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(name.toUpperCase(), 350, 750);

      const crime = getCrime();
      ctx.font = "italic 32px Arial";
      ctx.fillText("CRIME: " + crime, 350, 800);

      const reward = getReward();
      ctx.font = "bold 36px Arial";
      ctx.fillStyle = "#d35400";
      ctx.fillText("REWARD: " + reward, 350, 850);

      ctx.font = "italic 24px Arial";
      ctx.fillStyle = "#7f8c8d";
      ctx.fillText("Author: MOHAMMAD AKASH", 350, 890);

      await fs.writeFile(outputPath, canvas.toBuffer("image/jpeg"));

      message.reaction("✅", event.messageID);

      await message.reply({
        body: `📜 WANTED POSTER\n👤 Name: ${name}\n💣 Crime: ${crime}\n💰 Reward: ${reward}`,
        attachment: fs.createReadStream(outputPath)
      });

      // Cleanup temp files
      fs.unlink(avatarPath).catch(() => {});
      fs.unlink(outputPath).catch(() => {});

    } catch (err) {
      console.error("[Wanted] Full error:", err.message, err.stack);
      message.reaction("❌", event.messageID);
      message.reply(`❌ Error generating wanted poster: ${err.message}`);
    }
  }
};
