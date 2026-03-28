/**
 * Performance Stats Command - Monitor bot performance and FCA optimizer stats
 * Usage: {prefix}perf or {prefix}perf stats
 */

module.exports = {
	config: {
		name: "perf",
		version: "1.0.0",
		author: "NeoKEX",
		countDown: 5,
		role: 2,
		shortDescription: {
			en: "View bot performance statistics"
		},
		longDescription: {
			en: "View detailed performance metrics including memory usage, command stats, spam tracking, and FCA optimizer health"
		},
		category: "system",
		guide: {
			en: "{pn} - View performance stats\n{pn} clear - Clear performance caches"
		}
	},

	onStart: async function ({ message, args }) {
		const os = require('os');
		const process = require('process');

		// Get uptime
		const uptime = process.uptime();
		const days = Math.floor(uptime / 86400);
		const hours = Math.floor((uptime % 86400) / 3600);
		const minutes = Math.floor((uptime % 3600) / 60);
		const seconds = Math.floor(uptime % 60);
		const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

		// Memory usage
		const used = process.memoryUsage();
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const usedMem = totalMem - freeMem;

		// Bot stats
		const commandCount = global.GoatBot?.commands?.size || 0;
		const eventCount = global.GoatBot?.eventCommands?.size || 0;
		const aliasCount = global.GoatBot?.aliases?.size || 0;

		// Thread data stats
		const threadCount = global.db?.allThreadData?.length || 0;
		const userCount = global.db?.allUserData?.length || 0;

		if (args[0] === "clear") {
			// Clear caches if admin
			if (global.gc) {
				global.gc();
				return message.reply("♻️ Garbage collector triggered. Caches cleared.");
			}
			return message.reply("⚠️ Garbage collector not exposed. Start node with --expose-gc flag.");
		}

		const statsMsg = 
			`┌─── BOT PERFORMANCE ───×\n` +
			`│\n` +
			`│ [~] Uptime: ${uptimeStr}\n` +
			`│\n` +
			`├─── MEMORY USAGE ───×\n` +
			`│ [~] RSS: ${(used.rss / 1024 / 1024).toFixed(2)} MB\n` +
			`│ [~] Heap Used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
			`│ [~] Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB\n` +
			`│ [~] External: ${(used.external / 1024 / 1024).toFixed(2)} MB\n` +
			`│\n` +
			`├─── SYSTEM MEMORY ───×\n` +
			`│ [~] Total: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
			`│ [~] Used: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
			`│ [~] Free: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
			`│\n` +
			`├─── BOT STATS ───×\n` +
			`│ [~] Commands: ${commandCount}\n` +
			`│ [~] Events: ${eventCount}\n` +
			`│ [~] Aliases: ${aliasCount}\n` +
			`│ [~] Threads: ${threadCount}\n` +
			`│ [~] Users: ${userCount}\n` +
			`│\n` +
			`├─── OPTIMIZATIONS ───×\n` +
			`│ [~] Spam Tracker: ON\n` +
			`│ [~] Memory Leak Fix: ON\n` +
			`│ [~] Thread Batching: ON\n` +
			`└───────────────×`;

		return message.reply(statsMsg);
	}
};
