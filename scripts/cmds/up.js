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
    const bytesToMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

    const totalMemoryGB = bytesToGB(totalMemoryBytes);
    const usedMemoryGB = bytesToGB(usedMemoryBytes);
    const freeMemoryGB = bytesToGB(freeMemoryBytes);
    
    const cpus = os.cpus();
    const cpuModel = cpus[0].model.replace(/\s+/g, ' ');
    const cpuCores = cpus.length;
    const cpuSpeed = cpus[0].speed;
    
    const osType = os.type();
    const osPlatform = os.platform();
    const osRelease = os.release();
    const osHostname = os.hostname();
    
    const processMemoryUsage = process.memoryUsage();
    const nodeUsedMemoryMB = bytesToMB(processMemoryUsage.heapUsed);
    const nodeTotalMemoryMB = bytesToMB(processMemoryUsage.heapTotal);
    const nodeRSSMB = bytesToMB(processMemoryUsage.rss);
    
    // Load average (Unix/Linux only, Windows returns [0, 0, 0])
    const loadAvg = os.loadavg();
    const loadAvgStr = loadAvg.map(l => l.toFixed(2)).join(', ');
    
    // Bot stats
    const botID = global.GoatBot?.botID || 'N/A';
    const commandCount = global.GoatBot?.commands?.size || 0;
    const threadCount = global.db?.allThreadData?.length || 0;
    const userCount = global.db?.allUserData?.length || 0;

    const msg = 
      `┌─── BOT UPTIME ───×\n` +
      `│\n` +
      `│ [~] Uptime: ${botUptimeFormatted}\n` +
      `│ [~] Bot ID: ${botID}\n` +
      `│ [~] Commands: ${commandCount}\n` +
      `│ [~] Threads: ${threadCount}\n` +
      `│ [~] Users: ${userCount}\n` +
      `│\n` +
      `├─── NODE.JS ───×\n` +
      `│ [~] Version: v${process.versions.node}\n` +
      `│ [~] V8: ${process.versions.v8}\n` +
      `│ [~] PID: ${process.pid}\n` +
      `│\n` +
      `├─── BOT MEMORY ───×\n` +
      `│ [~] Heap Used: ${nodeUsedMemoryMB} MB\n` +
      `│ [~] Heap Total: ${nodeTotalMemoryMB} MB\n` +
      `│ [~] RSS: ${nodeRSSMB} MB\n` +
      `│\n` +
      `├─── SYSTEM ───×\n` +
      `│ [~] Hostname: ${osHostname}\n` +
      `│ [~] OS: ${osType} ${osRelease}\n` +
      `│ [~] Platform: ${osPlatform} (${os.arch()})\n` +
      `│\n` +
      `├─── HARDWARE ───×\n` +
      `│ [~] CPU: ${cpuModel}\n` +
      `│ [~] Cores: ${cpuCores} @ ${cpuSpeed}MHz\n` +
      `│ [~] RAM Used: ${usedMemoryGB} GB / ${totalMemoryGB} GB\n` +
      `│ [~] RAM Free: ${freeMemoryGB} GB\n` +
      `│ [~] Load Avg: [${loadAvgStr}]\n` +
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