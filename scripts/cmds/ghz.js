const WebSocket = require("ws");

const activeSessions = new Map();
const lastSentCache = new Map();
const favoriteMap = new Map();

let sharedWebSocket = null;
let keepAliveInterval = null;

function formatValue(val) {
	if (val >= 1_000_000) return `×${(val / 1_000_000).toFixed(1)}M`;
	if (val >= 1_000) return `×${(val / 1_000).toFixed(1)}K`;
	return `×${val}`;
}

function getPHTime() {
	return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

function cleanText(text) {
	return text ? text.trim().toLowerCase() : "";
}

function formatItems(items) {
	if (!Array.isArray(items)) return "";
	return items
		.filter(i => i && i.quantity > 0)
		.map(i => `│  ${i.emoji ? i.emoji + " " : ""}${i.name || "Unknown"}: ${formatValue(i.quantity)}`)
		.join("\n");
}

function ensureWebSocketConnection() {
	if (sharedWebSocket && sharedWebSocket.readyState === WebSocket.OPEN) return;
	sharedWebSocket = new WebSocket("wss://ghz.indevs.in/ghz");

	sharedWebSocket.on("open", () => {
		console.log("[GHZ] WebSocket connected");

		keepAliveInterval = setInterval(() => {
			if (sharedWebSocket && sharedWebSocket.readyState === WebSocket.OPEN) {
				sharedWebSocket.send("ping");
			}
		}, 10000);
	});

	sharedWebSocket.on("message", async (data) => {
		try {
			const payload = JSON.parse(data.toString());
			if (!payload) return;

			const seeds = Array.isArray(payload.seeds) ? payload.seeds : [];
			const gear = Array.isArray(payload.gear) ? payload.gear : [];
			const weather = payload.weather || null;

			for (const [threadId, session] of activeSessions.entries()) {

				const favList = favoriteMap.get(threadId) || [];

				let sections = [];
				let matchCount = 0;

				function checkItems(label, items) {
					const available = items.filter(i => i && i.quantity > 0);
					if (available.length === 0) return false;

					const matched = favList.length > 0
						? available.filter(i => favList.includes(cleanText(i.name)))
						: available;

					if (favList.length > 0 && matched.length === 0) return false;

					matchCount += matched.length;
					sections.push(`${label}\n${formatItems(matched)}`);
					return true;
				}

				checkItems("🌱  𝐒𝐄𝐄𝐃𝐒  🧱", seeds);
				checkItems("⚙️  𝐆𝐄𝐀𝐑  🛠️", gear);

				if (favList.length > 0 && matchCount === 0) continue;
				if (sections.length === 0) continue;

				const weatherInfo = weather
					? `🌤️  ═══════  𝐖𝐄𝐀𝐓𝐇𝐄𝐑  ═══════\n│  📊 ${weather.status || "❓ Unknown"}\n│  📝 ${weather.description || "📭 No description"}\n│  ⏰  𝐒𝐓𝐀𝐑𝐓: ${weather.startTime || "❓"}\n│  ⏰  𝐄𝐍𝐃: ${weather.endTime || "❓"}`
					: "";

				const updatedAt = payload.lastUpdated || getPHTime().toLocaleString("en-PH");

				const title = favList.length > 0
					? `❤️  ${matchCount} 𝐅𝐚𝐯𝐨𝐫𝐢𝐭𝐞 ${matchCount > 1 ? "Items" : "Item"} Found!  ❤️`
					: "🌾  ══════  𝐆𝐀𝐑𝐃𝐄𝐍 𝐇𝐎𝐑𝐈𝐙𝐎𝐍  ══════  🏪";

				const messageContent = `${title}

╭─── 𝐒𝐓𝐎𝐂𝐊𝐒 ───╮
${sections.join("\n")}
╰───────────────╯

${weatherInfo}

📅  𝐔𝐏𝐃𝐀𝐓𝐄𝐃: ${updatedAt}`.trim();
				if (!messageContent || messageContent.length === 0) continue;

				const messageKey = JSON.stringify({ title, sections, weatherInfo, updatedAt });
				const lastSent = lastSentCache.get(threadId);
				if (lastSent === messageKey) continue;
				lastSentCache.set(threadId, messageKey);

				await session.api.sendMessage({ body: messageContent }, session.threadID);

			}

		} catch (err) {
			console.error("[GHZ] Error processing message:", err.message);
		}

	});

	sharedWebSocket.on("close", () => {
		console.log("[GHZ] WebSocket closed, reconnecting...");
		clearInterval(keepAliveInterval);
		sharedWebSocket = null;
		setTimeout(ensureWebSocketConnection, 3000);
	});

	sharedWebSocket.on("error", (err) => {
		console.error("[GHZ] WebSocket error:", err.message);
		sharedWebSocket?.close();
	});

}

module.exports = {
	config: {
		name: "ghz",
		description: "🌱 Track Garden Horizon live stock market in real-time via WebSocket",
		usage: "{pn}ghz on | {pn}ghz off | {pn}ghz fav add 🔴 Carrot | 💧 Water | {pn}ghz fav remove Carrot",
		category: "Tools 🛠️",
		permission: 0,
		credits: "Prince"
	},

	langs: {
		en: {
			alreadyTracking: `╔══════════════════════════════════╗
║     📡  ALREADY TRACKING  📡     ║
╠══════════════════════════════════╣
║  You're already receiving live   ║
║  stock updates from Garden       ║
║  Horizon!                        ║
║                                  ║
║  💡 Use: {pn}ghz off             ║
║     to stop tracking             ║
╚══════════════════════════════════╝`,
			trackingStarted: `╔══════════════════════════════════╗
║   🌾  GARDEN HORIZON  🌾         ║
║        📡 LIVE TRACKING         ║
╠══════════════════════════════════╣
║  ✅ Successfully connected!     ║
║                                  ║
║  📊 Now receiving live           ║
║     stock market updates         ║
║                                  ║
║  🌱 Seeds  🧱  ⚙️ Gear  🛠️       ║
║     Updates in real-time         ║
╚══════════════════════════════════╝`,
			trackingStopped: `╔══════════════════════════════════╗
║   🌾  GARDEN HORIZON  🌾         ║
║       🛑 TRACKING STOPPED       ║
╠══════════════════════════════════╣
║  🛑 Tracking has been stopped    ║
║                                  ║
║  👋 Thank you for using          ║
║     Garden Horizon Tracker!     ║
║                                  ║
║  💡 Use: {pn}ghz on             ║
║     to start again               ║
╚══════════════════════════════════╝`,
			notTracking: `╔══════════════════════════════════╗
║     ⚠️  NOT TRACKING  ⚠️         ║
╠══════════════════════════════════╣
║  You're not currently tracking   ║
║  Garden Horizon stock market    ║
║                                  ║
║  💡 Use: {pn}ghz on             ║
║     to start tracking            ║
╚══════════════════════════════════╝`,
			favAdded: `╔══════════════════════════════════╗
║   ❤️  FAVORITES ADDED  ❤️       ║
╠══════════════════════════════════╣
║  Successfully added to your      ║
║  favorites list:                 ║
║                                  ║
${"%1"}
╚══════════════════════════════════╝`,
			favRemoved: `╔══════════════════════════════════╗
║   🗑️  FAVORITES REMOVED  🗑️     ║
╠══════════════════════════════════╣
║  Successfully removed from      ║
║  your favorites list:             ║
║                                  ║
${"%1"}
╚══════════════════════════════════╝`,
			favList: `╔══════════════════════════════════╗
║   📝  YOUR FAVORITES  📝        ║
╠══════════════════════════════════╣
║  Current favorite items:         ║
║                                  ║
${"%1"}
╚══════════════════════════════════╝`,
			emptyFav: "│  (No favorites yet)",
			invalidFav: `╔══════════════════════════════════╗
║    ⚠️  INVALID COMMAND  ⚠️       ║
╠══════════════════════════════════╣
║  Please use the correct format:  ║
║                                  ║
║  {pn}ghz fav add Item1 | Item2   ║
║  {pn}ghz fav remove Item1       ║
║                                  ║
║  Use "|" to separate multiple    ║
║  items when adding               ║
╚══════════════════════════════════╝`,
			help: `╔══════════════════════════════════╗
║  🌱  GARDEN HORIZON COMMANDS  🌱 ║
╠══════════════════════════════════╣
║                                  ║
║  📖  COMMANDS:                   ║
║  ─────────────────────           ║
║  {pn}ghz on                      ║
║     ➤ Start live tracking       ║
║                                  ║
║  {pn}ghz off                     ║
║     ➤ Stop tracking             ║
║                                  ║
║  {pn}ghz fav add Item            ║
║     ➤ Add favorite item(s)      ║
║     (use | for multiple)         ║
║                                  ║
║  {pn}ghz fav remove Item         ║
║     ➤ Remove favorite item      ║
║                                  ║
║  {pn}ghz fav list                ║
║     ➤ View favorites            ║
║                                  ║
╠══════════════════════════════════╣
║  💡  EXAMPLE:                    ║
║  {pn}ghz fav add Carrot | Water  ║
╚══════════════════════════════════╝`
		}
	},

	onStart: async ({ api, event, args, getLang }) => {
		const threadId = event.threadID;
		const subcmd = args[0]?.toLowerCase();

		if (subcmd === "fav") {
			const action = args[1]?.toLowerCase();
			const input = args.slice(2)
				.join(" ")
				.split("|")
				.map(i => cleanText(i))
				.filter(Boolean);

			if (!action || !["add", "remove", "list"].includes(action) || (input.length === 0 && action !== "list")) {
				return api.sendMessage(getLang("invalidFav"), threadId);
			}

			const currentFav = favoriteMap.get(threadId) || [];

			if (action === "list") {
				const favDisplay = currentFav.length > 0 
					? currentFav.map(item => `│  ❤️ ${item}`).join("\n")
					: getLang("emptyFav");
				return api.sendMessage(getLang("favList", favDisplay), threadId);
			}

			const updated = new Set(currentFav);

			for (const name of input) {
				if (action === "add") updated.add(name);
				else updated.delete(name);
			}

			favoriteMap.set(threadId, Array.from(updated));
			const favDisplay = Array.from(updated)
				.map(item => `│  ❤️ ${item}`)
				.join("\n") || getLang("emptyFav");

			if (action === "add") {
				return api.sendMessage(getLang("favAdded", favDisplay), threadId);
			} else {
				return api.sendMessage(getLang("favRemoved", favDisplay), threadId);
			}
		}

		if (subcmd === "off") {
			if (!activeSessions.has(threadId)) {
				return api.sendMessage(getLang("notTracking"), threadId);
			}

			activeSessions.delete(threadId);
			lastSentCache.delete(threadId);
			return api.sendMessage(getLang("trackingStopped"), threadId);
		}
		if (subcmd !== "on") {
			const prefix = global.GoatBot.config.prefix;
			return api.sendMessage(getLang("help").replace(/{pn}/g, prefix + "ghz"), threadId);
		}

		if (activeSessions.has(threadId)) {
			const prefix = global.GoatBot.config.prefix;
			return api.sendMessage(getLang("alreadyTracking").replace(/{pn}/g, prefix), threadId);
		}

		activeSessions.set(threadId, { api, threadID: threadId });
		const prefix = global.GoatBot.config.prefix;
		await api.sendMessage(getLang("trackingStarted").replace(/{pn}/g, prefix), threadId);
		ensureWebSocketConnection();
	}
};
