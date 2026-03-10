const WebSocket = require("ws");

const activeSessions = new Map();
const lastSentCache = new Map();
const favoriteMap = new Map();

let sharedWebSocket = null;
let keepAliveInterval = null;

function formatValue(val) {
	if (val >= 1_000_000) return `x${(val / 1_000_000).toFixed(1)}M`;
	if (val >= 1_000) return `x${(val / 1_000).toFixed(1)}K`;
	return `x${val}`;
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
		.map(i => `- ${i.emoji ? i.emoji + " " : ""}${i.name || "Unknown"}: ${formatValue(i.quantity)}`)
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
					sections.push(`${label}:\n${formatItems(matched)}`);
					return true;
				}

				checkItems("🌱 𝐒𝐞𝐞𝐝𝐬 🧱", seeds);
				checkItems("🛠️ 𝐆𝐞𝐚𝐫 ⚙️", gear);

				if (favList.length > 0 && matchCount === 0) continue;
				if (sections.length === 0) continue;

				const weatherInfo = weather
					? `🌤️ ════ 𝗪𝗘𝗔𝗧𝗛𝗘𝗥 ════\n   📊 ${weather.status || "❓ Unknown"}\n   📝 ${weather.description || "📭 No description"}\n   ⏰ 🅂︎🅃︎🄰︎🅁︎🅃: ${weather.startTime || "❓"}\n   ⏰ 🄴︎🄽︎🄳: ${weather.endTime || "❓"}`
					: "";

				const updatedAt = payload.lastUpdated || getPHTime().toLocaleString("en-PH");

				const title = favList.length > 0
					? `❤️ ━━━━ ${matchCount} 𝐅𝐚𝐯𝐨𝐫𝐢𝐭𝐞 ${matchCount > 1 ? "Items" : "Item"} Found! ━━━━`
					: "🌾 ════ 𝗚𝗔𝗥𝗗𝗘𝗡 𝗛𝗢𝗥𝗜𝗭𝗢𝗡 ════ 🏪";

				const messageContent = `${title}

${sections.join("\n\n")}

${weatherInfo}

📅 🅄︎🄿︎🅳︎🄰︎🅃︎🄴︎🄳: ${updatedAt}`.trim();
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
			alreadyTracking: "📡  You're already tracking Garden Horizon!\n\n💡 Use: {pn}ghz off - to stop tracking",
			trackingStarted: "✅━━━━━━━━━━━━━━━━━━━━━\n   🌾 Garden Horizon Tracking Started!\n   📡 Now receiving live stock updates\n━━━━━━━━━━━━━━━━━━━━━",
			trackingStopped: "🛑━━━━━━━━━━━━━━━━━━━━━\n   🌾 Garden Horizon Tracking Stopped\n   👋 Bye bye, happy gardening!\n━━━━━━━━━━━━━━━━━━━━━",
			notTracking: "⚠️━━━━━━━━━━━━━━━━━━━━━\n   Oops! You're not tracking yet\n\n💡 Use: {pn}ghz on - to start\n━━━━━━━━━━━━━━━━━━━━━",
			favAdded: "✅━━━━━━━━━━━━━━━━━━━━━\n   ❤️ Favorite Items Added!\n\n%1\n━━━━━━━━━━━━━━━━━━━━━",
			favRemoved: "✅━━━━━━━━━━━━━━━━━━━━━\n   🗑️ Favorite Items Removed!\n\n%1\n━━━━━━━━━━━━━━━━━━━━━",
			favList: "📝━━━━━━━━━━━━━━━━━━━━━\n   ❤️ Your Favorite Items:\n\n%1\n━━━━━━━━━━━━━━━━━━━━━",
			emptyFav: "   (No favorites yet)",
			invalidFav: "📌━━━━━━━━━━━━━━━━━━━━━\n   Invalid Command Format!\n\n💡 Usage:\n   {pn}ghz fav add Item1 | Item2\n   {pn}ghz fav remove Item1\n━━━━━━━━━━━━━━━━━━━━━",
			help: `🌾╔══════════════════════════════╗
   ║  🌱 Garden Horizon Commands  ║
   ╚══════════════════════════════╝

📖 Commands:
┌─────────────────────────────┐
│ {pn}ghz on                  │ ➤ Start tracking stocks
│ {pn}ghz off                 │ ➤ Stop tracking stocks
│ {pn}ghz fav add Item1 | ..  │ ➤ Add favorite items
│ {pn}ghz fav remove Item1    │ ➤ Remove favorite items
└─────────────────────────────┘

💡 Example:
   {pn}ghz fav add Carrot | Watering Can`
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

			if (!action || !["add", "remove"].includes(action) || input.length === 0) {
				return api.sendMessage(getLang("invalidFav"), threadId);
			}

			const currentFav = favoriteMap.get(threadId) || [];
			const updated = new Set(currentFav);

			for (const name of input) {
				if (action === "add") updated.add(name);
				else updated.delete(name);
			}

			favoriteMap.set(threadId, Array.from(updated));
			const favList = Array.from(updated).join(", ") || getLang("emptyFav");

			if (action === "add") {
				return api.sendMessage(getLang("favAdded", favList), threadId);
			} else {
				return api.sendMessage(getLang("favRemoved", favList), threadId);
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
			return api.sendMessage(getLang("alreadyTracking"), threadId);
		}

		activeSessions.set(threadId, { api, threadID: threadId });
		await api.sendMessage(getLang("trackingStarted"), threadId);
		ensureWebSocketConnection();
	}
};
