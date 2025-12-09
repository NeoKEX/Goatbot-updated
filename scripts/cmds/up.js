const os = require('os');

function formatDuration(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    const timeFormat = [h, m, s]
        .map(t => t.toString().padStart(2, '0'))
        .join(':');

    return d > 0 ? `${d} day${d > 1 ? 's' : ''}, ${timeFormat}` : timeFormat;
}

module.exports = {
  config: {
    name: "uptime",
    aliases: ["runtime", "status", "upt", "up"],
    version: "1.3", 
    author: "NeoKEX",
    countDown: 5,
    role: 0,
    longDescription: "Shows the bot's uptime and hosting environment details.",
    category: "system",
    guide: { en: "{pn}" }
  },

  onStart: async function({ message, event }) {
    const processUptimeSeconds = process.uptime();
    const botUptimeFormatted = formatDuration(processUptimeSeconds);
    
    const totalMemoryBytes = os.totalmem();
    const freeMemoryBytes = os.freemem();
    const usedMemoryBytes = totalMemoryBytes - freeMemoryBytes;
    
    const bytesToGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2);

    const totalMemoryGB = bytesToGB(totalMemoryBytes);
    const usedMemoryGB = bytesToGB(usedMemoryBytes);
    
    const cpuModel = os.cpus()[0].model.replace(/\s+/g, ' '); 
    const osType = os.type();
    
    const processMemoryUsage = process.memoryUsage();
    const nodeUsedMemoryMB = (processMemoryUsage.heapUsed / 1024 / 1024).toFixed(2);

    const msg = 
      `┌─── BOT UPTIME ───×\n` +
      `│\n` +
      `│ [~] Uptime: ${botUptimeFormatted}\n` +
      `│ [~] Node: v${process.versions.node}\n` +
      `│ [~] RAM (Bot): ${nodeUsedMemoryMB}MB\n` +
      `│\n` +
      `├─── HOSTING ───×\n` +
      `│ [~] OS: ${osType} (${os.arch()})\n` +
      `│ [~] CPU: ${cpuModel}\n` +
      `│ [~] RAM (Used/Total): ${usedMemoryGB}GB / ${totalMemoryGB}GB\n` +
      `└───────────────×`;
      
    message.reply(msg);
  }
};

function formatDuration(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    const timeFormat = [h, m, s]
        .map(t => t.toString().padStart(2, '0'))
        .join(':');

    return d > 0 ? `${d} day${d > 1 ? 's' : ''}, ${timeFormat}` : timeFormat;
      }