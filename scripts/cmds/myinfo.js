const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const numberNames = [
  "", "Thousand", "Million", "Billion", "Trillion", "Quadrillion", "Quintillion",
  "Sextillion", "Septillion", "Octillion", "Nonillion", "Decillion", "Undecillion",
  "Duodecillion", "Tredecillion", "Quattuordecillion", "Quindecillion", "Sexdecillion",
  "Septendecillion", "Octodecillion", "Novemdecillion", "Vigintillion", "Unvigintillion",
  "Duovigintillion", "Tresvigintillion", "Quattuorvigintillion", "Quinvigintillion",
  "Sesvigintillion", "Septemvigintillion", "Octovigintillion", "Novemvigintillion",
  "Trigintillion", "Untrigintillion", "Duotrigintillion", "Googol", "Googolplex",
  "Centillion", "Uncentillion", "Duocentillion", "Trecentillion", "Quattuorcentillion",
  "Quincentillion", "Sexcentillion", "Septencentillion", "Octocentillion",
  "Novemcentillion", "Quattuordecillion", "Quindecillion", "Sexdecillion",
  "Septendecillion", "Octodecillion", "Novemdecillion", "Vigintillion",
  "Unvigintillion", "Duovigintillion", "Tresvigintillion", "Quattuorvigintillion",
  "Quinvigintillion", "Sesvigintillion", "Septemvigintillion", "Octovigintillion",
  "Novemvigintillion", "Trigintillion", "Untrigintillion", "Duotrigintillion",
  "Tretrigintillion", "Quattuortrigintillion", "Quintrigintillion", "Sestrigintillion",
  "Septentrigintillion", "Octotrigintillion", "Novemtrigintillion", "Quadragintillion",
  "Unquadragintillion", "Duoquadragintillion", "Trequadragintillion",
  "Quattuorquadragintillion", "Quinquadragintillion", "Sexquadragintillion",
  "Septenquadragintillion", "Octoquadragintillion", "Novemquadragintillion",
  "Quinquagintillion", "Unquinquagintillion", "Duoquinquagintillion",
  "Trequinquagintillion", "Quattuorquinquagintillion", "Quinquinquagintillion",
  "Sexquinquagintillion", "Septenquinquagintillion", "Octoquinquagintillion",
  "Novemquinquagintillion", "Sexagintillion", "Unsexagintillion", "Duosexagintillion",
  "Tresexagintillion", "Quattuorsexagintillion", "Quinsexagintillion",
  "Sexsexagintillion", "Septensexagintillion", "Octosexagintillion",
  "Novemsexagintillion", "Septuagintillion", "Unseptuagintillion",
  "Duoseptuagintillion", "Treseptuagintillion", "Quattuorseptuagintillion",
  "Quinseptuagintillion", "Sexseptuagintillion", "Septenseptuagintillion",
  "Octoseptuagintillion", "Novemseptuagintillion", "Octogintillion",
  "Unoctogintillion", "Duoctogintillion", "Treoctogintillion", "Quattuoroctogintillion",
  "Quinoctogintillion", "Sexoctogintillion", "Septemoctogintillion",
  "Octooctogintillion", "Novemoctogintillion", "Nonagintillion", "Unnonagintillion",
  "Duononagintillion", "Trenonagintillion", "Quattuornonagintillion",
  "Quinnonagintillion", "Sexnonagintillion", "Septennonagintillion",
  "Octononagintillion", "Novemnonagintillion", "Centillion"
];

function formatMoney(num) {
  if (num === 0) return "0";
  if (num < 1000) return num.toString();
  const exp = Math.floor(Math.log(num) / Math.log(1000));
  if (exp >= numberNames.length) return "∞Infinity";
  const value = num / Math.pow(1000, exp);
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} ${numberNames[exp]}`;
}

function expToLevel(exp, deltaNext = 5) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

function levelToExp(level, deltaNext = 5) {
  return Math.floor(((Math.pow(level, 2) - level) * deltaNext) / 2);
}

module.exports = {
  config: {
    name: "myinfo",
    aliases: ["mi", "member"],
    version: "2.0",
    author: "Rômeo",
    countDown: 5,
    shortDescription: { en: "Show user info card" },
    longDescription: { en: "Generate a canvas image showing user stats" },
    category: "info"
  },

  onStart: async function ({ event, message, usersData, args, api, threadsData }) {
    let avatarUrl;
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions)[0];
    let uid;

    if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) {
          uid = match[1];
        }
      }
    }

    if (!uid) {
      uid = event.type === "message_reply" ? event.messageReply.senderID : uid2 || uid1;
    }

    avatarUrl = await usersData.getAvatarUrl(uid);
    const userData = await usersData.get(uid);
    const allUsers = await usersData.getAll();
    const threadID = event.threadID;
    const threadData = await threadsData.get(threadID);
    const memberData = threadData.members.find(member => member.userID === uid);
    const messages = memberData ? memberData.count || 0 : 0;

    let username;
    try {
      const userInfo = await api.getUserInfo(uid);
      username = userInfo[uid]?.vanity || userInfo[uid]?.name || "Not set";
    } catch (e) {
      username = userData.name || "Not set";
    }

    let genderText;
    switch (userData.gender) {
      case 1:
        genderText = "Female"; break;
      case 2:
        genderText = "Male"; break;
      default:
        genderText = "Unknown";
    }

    const deltaNext = 5;
    const exp = userData.exp || 0;
    const levelUser = expToLevel(exp, deltaNext);
    const expCurrentLevel = levelToExp(levelUser, deltaNext);
    const expNextLevel = levelToExp(levelUser + 1, deltaNext);
    const expProgress = exp - expCurrentLevel;
    const expForNextLevel = expNextLevel - expCurrentLevel;
    const percentage = Math.floor((expProgress / expForNextLevel) * 100);

    const usersWithExp = allUsers.filter(u => typeof u.exp === "number").sort((a, b) => b.exp - a.exp);
    const expRank = usersWithExp.findIndex(u => u.userID === uid) + 1;

    const usersWithMoney = allUsers.filter(u => typeof u.money === "number").sort((a, b) => b.money - a.money);
    const moneyRank = usersWithMoney.findIndex(u => u.userID === uid) + 1;

    const name = userData.name || "Unknown";
    const money = userData.money || 0;
    const avatarBuffer = (await axios.get(avatarUrl, { responseType: "arraybuffer" })).data;
    const avatar = await loadImage(avatarBuffer);

    const canvas = createCanvas(1366, 768);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0f0f1c");
    gradient.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = "white";
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 🔥 Random Color
    const randomColor = getRandomColor();

    // Border
    ctx.strokeStyle = randomColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Avatar neon circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(683, 130, 90, 0, Math.PI * 2, true);
    ctx.shadowColor = randomColor;
    ctx.shadowBlur = 40;
    ctx.strokeStyle = randomColor;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Draw Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(683, 130, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 603, 50, 160, 160);
    ctx.restore();

    ctx.font = "bold 50px Arial";
ctx.textAlign = "center";

// Neon glow with stroke
ctx.save();
ctx.shadowColor = randomColor;
ctx.shadowBlur = 30;
ctx.strokeStyle = randomColor;
ctx.lineWidth = 4;
ctx.strokeText(name, 683, 280); // Stroke with neon
ctx.fillStyle = "#FFFFFF";
ctx.fillText(name, 683, 280);   // Fill text
ctx.restore();

    ctx.font = "bold 30px Arial";
    ctx.textAlign = "left";

    const infoLines = [
      `🆔 User ID: ${uid}`,
      `✏️ Nickname: ${name}`,
      ` Gender: ${genderText}`,
      `🌐 Username: ${username}`,
      `* Level: ${levelUser}`,
      `⚡ Exp: ${exp}`,
      `💰 Money: $${formatMoney(money)}`,
      `💬 Messages: ${formatNumber(messages)}`,
      `🏆 EXP Rank: #${expRank}`,
      `💸 Money Rank: #${moneyRank}`
    ];

    const leftX = 200;
    const rightX = 800;
    const baseY = 350;
    const gap = 50;

    for (let i = 0; i < 5; i++) {
      ctx.fillText(infoLines[i], leftX, baseY + (i * gap));
    }
    for (let i = 5; i < 10; i++) {
      ctx.fillText(infoLines[i], rightX, baseY + ((i - 5) * gap));
    }

    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#FF6688";
    ctx.textAlign = "center";
    ctx.fillText(`Last Update: ${moment().format("YYYY-MM-DD HH:mm:ss")}`, canvas.width / 2, 740);

    const tmpPath = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);
    const imagePath = path.join(tmpPath, `${uid}_info.png`);
    fs.writeFileSync(imagePath, canvas.toBuffer());

    message.reply({
      body: "Here's your profile card:",
      attachment: fs.createReadStream(imagePath),
    }, () => fs.unlinkSync(imagePath));
  }
};