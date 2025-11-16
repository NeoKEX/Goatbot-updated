const os = require("os");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const W = 490, H = 840;
const AVATAR1 = "https://i.imgur.com/BqkjjiW.jpeg";
const AVATAR2 = "https://i.imgur.com/ddb5HOe.jpeg";
const FALLBACK_AVATAR = "https://i.ibb.co/MC6bT5V/default-avatar.png"; // fallback if error

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

async function drawNeonGlow(ctx, x, y, radius, colors) {
  for (let i = colors.length - 1; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(x, y, radius + i * 6, 0, Math.PI * 2);
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 4;
    ctx.shadowColor = colors[i];
    ctx.shadowBlur = 20;
    ctx.stroke();
  }
}

async function drawCircularAvatar(ctx, url, x, y, size, glowColors) {
  let img;
  try {
    img = await loadImage(url);
  } catch (e1) {
    console.warn("⚠️ Avatar failed, using fallback");
    try {
      img = await loadImage(FALLBACK_AVATAR);
    } catch (e2) {
      console.error("❌ Fallback avatar failed:", e2.message);
      return;
    }
  }

  const radius = size / 2;
  await drawNeonGlow(ctx, x + radius, y + radius, radius, glowColors);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

async function drawPage1(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#4b006e");
  gradient.addColorStop(1, "#1a001f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  const particles = [
    { x: 50, y: 120, r: 3 }, { x: 120, y: 230, r: 2.5 },
    { x: 300, y: 180, r: 3.5 }, { x: 400, y: 310, r: 2 },
    { x: 180, y: 360, r: 3 }, { x: 420, y: 430, r: 2.2 },
    { x: 80, y: 500, r: 3.2 }, { x: 350, y: 520, r: 2.7 },
    { x: 220, y: 600, r: 3.8 }, { x: 430, y: 670, r: 2.6 }
  ];
  for (const p of particles) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 102, 204, 0.15)";
    ctx.shadowColor = "rgba(255, 102, 204, 0.7)";
    ctx.shadowBlur = 10;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  await drawCircularAvatar(ctx, AVATAR1, W / 2 - 90, 60, 180, [
    "#ff99cc", "#ff33aa", "#cc0077", "#ff66cc"
  ]);

  ctx.font = "bold 38px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff99cc";
  ctx.shadowColor = "#ff33aa";
  ctx.shadowBlur = 25;
  ctx.fillText("Voldigo Zaraki Anos", W / 2, 290);

  ctx.font = "italic 20px Arial";
  ctx.fillStyle = "#ff66cc";
  ctx.shadowColor = "#cc3399";
  ctx.shadowBlur = 15;
  ctx.fillText("Owner Information", W / 2, 325);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(40, 360, W - 80, 360);

  ctx.strokeStyle = "#cc3399";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#ff66cc";
  ctx.shadowBlur = 12;
  ctx.strokeRect(40, 360, W - 80, 360);

  ctx.font = "22px Arial";
  ctx.fillStyle = "#f2ccff";
  ctx.shadowColor = "#cc33aa";
  ctx.shadowBlur = 12;

  const lines = [
    "Nickname: VOLDIGO", "Age: 16+", "DOB: 5 novembre 2008",
    "Gender: Male", "Religion: Chrétien", "Nationality: Ivoirien",
    "Location: Abidjan, Cocody", "Class: nouveau en première",
    `Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Dhaka" })}`
  ];
  let y = 400;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 38;
  }

  ctx.font = "italic 18px Arial";
  ctx.fillStyle = "#e673ff";
  ctx.shadowColor = "#ff99ff";
  ctx.shadowBlur = 25;
  ctx.fillText("🟣 To see Voldigo Bot's system info,", W / 2, H - 55);
  ctx.fillText("reply to this image with: 2", W / 2, H - 30);
}

async function drawPage2(ctx, uptimeMs, ping, users, threads) {
  ctx.fillStyle = "#00111a";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#004466";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < H; i += 30) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
  }
  for (let i = 0; i < W; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
  }

  await drawCircularAvatar(ctx, AVATAR2, W / 2 - 90, 50, 180, [
    "#00ffff", "#00cccc", "#009999"
  ]);

  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#00e6ff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 18;
  ctx.fillText("Haruka Sakura", W / 2, 270);

  ctx.shadowBlur = 0;
  ctx.textAlign = "left";
  ctx.font = "20px Consolas";
  ctx.fillStyle = "#aaffff";

  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Dhaka" });
  const cpuModel = os.cpus()[0]?.model || "Unknown CPU";
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const usedMem = (totalMem - freeMem).toFixed(2);
  const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  const osInfo = `${os.type()} ${os.arch()}`;

  const lines = [
    `🟢 Uptime: ${formatUptime(uptimeMs)}`,
    `📅 Time: ${now}`,
    `📡 Ping: ${ping} ms`,
    `💻 CPU: ${cpuModel}`,
    `📂 OS: ${osInfo}`,
    `📊 RAM: ${ramUsage} MB used`,
    `💾 Memory: ${usedMem} / ${totalMem} GB`,
    `👥 Users: ${users}`, `💬 Threads: ${threads}`
  ];

  let y = 310;
  for (const line of lines) {
    ctx.fillText(line, 40, y);
    y += 34;
  }
}

module.exports = {
  config: {
    name: "info",
    aliases: ["in4", "ownerinfo"],
    version: "1.2-stable",
    author: "Ew'r Saim",
    countDown: 5,
    role: 0,
    shortDescription: "Owner & system info (stable fast)",
    category: "information"
  },

  onStart: async function ({ message, args, usersData, threadsData }) {
    const page = parseInt(args[0]) || 1;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    if (page === 1) {
      await drawPage1(ctx);
    } else {
      const ping = Math.floor(Math.random() * 10) + 5;
      const uptimeMs = process.uptime() * 1000;
      let users = 0, threads = 0;
      try { users = (await usersData.getAll())?.length || 0; } catch {}
      try { threads = (await threadsData.getAll())?.length || 0; } catch {}
      await drawPage2(ctx, uptimeMs, ping, users, threads);
    }

    const buffer = canvas.toBuffer("image/png");
    const dir = path.join(__dirname, "cache");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const filePath = path.join(dir, `info_page.png`);
    fs.writeFileSync(filePath, buffer);
    return message.reply({ attachment: fs.createReadStream(filePath) });
  },

  onChat: async function ({ event, message, usersData, threadsData }) {
    if (event.body?.trim() === "2") {
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      const ping = Math.floor(Math.random() * 10) + 5;
      const uptimeMs = process.uptime() * 1000;
      let users = 0, threads = 0;
      try { users = (await usersData.getAll())?.length || 0; } catch {}
      try { threads = (await threadsData.getAll())?.length || 0; } catch {}

      await drawPage2(ctx, uptimeMs, ping, users, threads);

      const buffer = canvas.toBuffer("image/png");
      const dir = path.join(__dirname, "cache");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      const filePath = path.join(dir, `info_reply_2.png`);
      fs.writeFileSync(filePath, buffer);

      return message.reply({ attachment: fs.createReadStream(filePath) });
    }
  }
};