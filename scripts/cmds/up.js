const os = require("os");
const path = require("path");
const fs = require("fs");
const { createCanvas } = require("canvas");

process.stderr.clearLine = process.stderr.clearLine || function () {};
process.stdout.clearLine = process.stdout.clearLine || function () {};

module.exports = {
  config: {
    name: "uptime",
    aliases: ["runtime", "up"],
    version: "1.10",
    author: "NZ R",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Check system uptime and status with image" },
    longDescription: { en: "Displays the system uptime, RAM usage, CPU load, and other server details on an image." },
    category: "SYSTEM",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const cacheFolderPath = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheFolderPath)) fs.mkdirSync(cacheFolderPath, { recursive: true });
    const imagePath = path.join(cacheFolderPath, `uptime_${Date.now()}.png`);

    try {
      api.setMessageReaction("📡", event.messageID, () => {}, true);

      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const usedGB = (usedMem / 1024 / 1024 / 1024).toFixed(2);
      const totalGB = (totalMem / 1024 / 1024 / 1024).toFixed(2);

      const cpus = os.cpus();
      let totalIdle = 0, totalTick = 0;
      cpus.forEach(cpu => {
        for (const type in cpu.times) totalTick += cpu.times[type];
        totalIdle += cpu.times.idle;
      });
      const avgCpuLoad = ((1 - totalIdle / totalTick) * 100).toFixed(2);

      const ping = Date.now() - event.timestamp;
      const platform = `${os.platform()} (${os.arch()})`;
      const nodeVersion = process.version;
      const hostname = os.hostname();

      const info = [
        { label: "Uptime", value: uptimeString },
        { label: "Ping", value: `${ping} ms` },
        { label: "RAM Usage", value: `${usedGB} GB / ${totalGB} GB` },
        { label: "CPU Load", value: `${avgCpuLoad}%` },
        { label: "Platform", value: platform },
        { label: "Node.js", value: nodeVersion },
        { label: "Hostname", value: hostname }
      ];

      const width = 1400;
      const height = 800;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#181825');
      gradient.addColorStop(1, '#0a0a10');
      
      const rx = 60, ry = 60;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(width - rx, 0);
      ctx.quadraticCurveTo(width, 0, width, ry);
      ctx.lineTo(width, height - ry);
      ctx.quadraticCurveTo(width, height, width - rx, height);
      ctx.lineTo(rx, height);
      ctx.quadraticCurveTo(0, height, 0, height - ry);
      ctx.lineTo(0, ry);
      ctx.quadraticCurveTo(0, 0, rx, 0);
      ctx.closePath();
      ctx.fill();

      const infoBoxWidth = 1260;
      const infoBoxHeight = 610;
      const infoBoxX = (width - infoBoxWidth) / 2;
      const infoBoxY = (height - infoBoxHeight) / 2;
      const infoBoxRx = 70, infoBoxRy = 70;

      ctx.shadowColor = 'rgba(44, 39, 66, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;

      ctx.fillStyle = 'rgba(21, 21, 32, 0.98)';
      ctx.beginPath();
      ctx.moveTo(infoBoxX + infoBoxRx, infoBoxY);
      ctx.lineTo(infoBoxX + infoBoxWidth - infoBoxRx, infoBoxY);
      ctx.quadraticCurveTo(infoBoxX + infoBoxWidth, infoBoxY, infoBoxX + infoBoxWidth, infoBoxY + infoBoxRy);
      ctx.lineTo(infoBoxX + infoBoxWidth, infoBoxY + infoBoxHeight - infoBoxRy);
      ctx.quadraticCurveTo(infoBoxX + infoBoxWidth, infoBoxY + infoBoxHeight, infoBoxX + infoBoxWidth - infoBoxRx, infoBoxY + infoBoxHeight);
      ctx.lineTo(infoBoxX + infoBoxRx, infoBoxY + infoBoxHeight);
      ctx.quadraticCurveTo(infoBoxX, infoBoxY + infoBoxHeight, infoBoxX, infoBoxY + infoBoxHeight - infoBoxRy);
      ctx.lineTo(infoBoxX, infoBoxY + infoBoxRy);
      ctx.quadraticCurveTo(infoBoxX, infoBoxY, infoBoxX + infoBoxRx, infoBoxY);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      const centerX = width / 2;
      const centerY = height / 2;
      
      const radialGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 160);
      radialGradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
      radialGradient.addColorStop(0.7, 'rgba(139, 92, 246, 0)');
      radialGradient.addColorStop(1, 'transparent'); 
      
      ctx.fillStyle = radialGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 130, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '500 40px sans-serif';
      
      const startY = infoBoxY + 120;

      info.forEach((item, i) => {
        const yPos = startY + i * 75;

        ctx.fillStyle = '#d1c4e9';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, 160, yPos);

        ctx.fillStyle = '#e0e0f4';
        ctx.fillText(item.value, 600, yPos);

        ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(160, yPos + 28);
        ctx.lineTo(1240, yPos + 28);
        ctx.stroke();
      });

      const out = fs.createWriteStream(imagePath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on('finish', () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        api.sendMessage({ attachment: fs.createReadStream(imagePath) }, threadID, (err) => {
          if (!err) fs.unlink(imagePath, () => {});
          else {
            if (fs.existsSync(imagePath)) fs.unlink(imagePath, () => {});
          }
        }, messageID);
      });

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      if (fs.existsSync(imagePath)) fs.unlink(imagePath, () => {});
    }
  }
};
