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
	return text.trim().toLowerCase();
}

function formatItems(items) {
	return items
		.filter(i => i.quantity > 0)
		.map(i => `- ${i.emoji ? i.emoji + " " : ""}${i.name}: ${formatValue(i.quantity)}`)
		.join("\n");
}

function ensureWebSocketConnection() {
	if (sharedWebSocket && sharedWebSocket.readyState === WebSocket.OPEN) return;

	sharedWebSocket = new WebSocket("wss://garden-horizons-notifier.onrender.com/");

	sharedWebSocket.on("open", () => {
		keepAliveInterval = setInterval(() => {
			if (sharedWebSocket.readyState === WebSocket.OPEN) {
				sharedWebSocket.send("ping");
			}
		}, 10000);
	});

	sharedWebSocket.on("message", async (data) => {
		try {
			const payload = JSON.parse(data);
			if (!payload) return;

			const seeds = Array.isArray(payload.seeds) ? payload.seeds : [];
			const gear = Array.isArray(payload.gear) ? payload.gear : [];
			const weather = payload.weather || null;

			for (const [senderId, session] of activeSessions.entries()) {
				const favList = favoriteMap.get(senderId) || [];
				let sections = [];
				let matchCount = 0;

				function checkItems(label, items) {
					const available = items.filter(i => i.quantity > 0);
					if (available.length === 0) return false;

					const matched = favList.length > 0
						? available.filter(i => favList.includes(cleanText(i.name)))
						: available;

					if (favList.length > 0 && matched.length === 0) return false;

					matchCount += matched.length;
					sections.push(`${label}:\n${formatItems(matched)}`);
					return true;
				}

				checkItems("🌱 𝗦𝗲𝗲𝗱𝘀", seeds);
				checkItems("🛠️ 𝗚𝗲𝗮𝗿", gear);

				if (favList.length > 0 && matchCount === 0) continue;
				if (sections.length === 0) continue;

				const weatherInfo = weather
					? `🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿: ${weather.status}
📋 ${weather.description}
🕒 Start: ${weather.startTime}
🕒 End: ${weather.endTime}`
					: "";

				const updatedAt = payload.lastUpdated || getPHTime().toLocaleString("en-PH");

				const title = favList.length > 0
					? `❤️ ${matchCount} 𝗙𝗮𝘃𝗼𝗿𝗶𝘁𝗲 𝗜𝘁𝗲𝗺${matchCount > 1 ? "s" : ""} 𝗙𝗼𝘂𝗻𝗱!`
					: "🌾 𝗚𝗮𝗿𝗱𝗲𝗻 𝗛𝗼𝗿𝗶𝘇𝗼𝗻 — 𝗦𝘁𝗼𝗰𝗸";

				const messageKey = JSON.stringify({ title, sections, weatherInfo, updatedAt });
				const lastSent = lastSentCache.get(senderId);

				if (lastSent === messageKey) continue;
				lastSentCache.set(senderId, messageKey);

				await session.api.sendMessage({
					text: `${title}

${sections.join("\n\n")}

${weatherInfo}

📅 Updated: ${updatedAt}`
				}, session.threadID);
			}
		} catch {}
	});

	sharedWebSocket.on("close", () => {
		clearInterval(keepAliveInterval);
		sharedWebSocket = null;
		setTimeout(ensureWebSocketConnection, 3000);
	});

	sharedWebSocket.on("error", () => {
		sharedWebSocket?.close();
	});
}

module.exports = {
	config: {
		name: "gh",
		version: "1.0",
		author: "YourName",
		countDown: 5,
		role: 0,
		description: {
			vi: "Theo dõi stock Garden Horizon qua WebSocket",
			en: "Track Garden Horizon stock using WebSocket"
		},
		category: "Tools ⚒️",
		guide: {
			vi: "   {pn} on: Bắt đầu theo dõi stock Garden Horizon"
				+ "\n   {pn} off: Dừng theo dõi"
				+ "\n   {pn} fav add Item1 | Item2: Thêm item yêu thích"
				+ "\n   {pn} fav remove Item1 | Item2: Xóa item yêu thích",
			en: "   {pn} on: Start tracking Garden Horizon stock"
				+ "\n   {pn} off: Stop tracking"
				+ "\n   {pn} fav add Item1 | Item2: Add favorite items"
				+ "\n   {pn} fav remove Item1 | Item2: Remove favorite items"
		}
	},

	langs: {
		vi: {
			alreadyTracking: "📡 Bạn đang theo dõi Garden Horizon rồi.\nSử dụng {pn} off để dừng.",
			trackingStarted: "✅ Đã bắt đầu theo dõi Garden Horizon!",
			trackingStopped: "🛑 Đã dừng theo dõi Garden Horizon.",
			notTracking: "⚠️ Bạn chưa bắt đầu theo dõi.",
			favAdded: "✅ Đã thêm item yêu thích:\n%1",
			favRemoved: "✅ Đã xóa item yêu thích:\n%1",
			favList: "📝 Danh sách yêu thích hiện tại:\n%1",
			emptyFav: "(trống)",
			invalidFav: "📌 Cách sử dụng: {pn} fav add/remove Item1 | Item2",
			help: `📌 Lệnh Garden Horizon

• {pn} on - Bắt đầu theo dõi
• {pn} off - Dừng theo dõi
• {pn} fav add Carrot | Watering Can - Thêm item yêu thích
• {pn} fav remove Carrot - Xóa item yêu thích`
		},
		en: {
			alreadyTracking: "📡 You're already tracking Garden Horizon.\nUse {pn} off to stop.",
			trackingStarted: "✅ Garden Horizon tracking started!",
			trackingStopped: "🛑 Garden Horizon tracking stopped.",
			notTracking: "⚠️ You haven't started tracking yet.",
			favAdded: "✅ Favorite items added:\n%1",
			favRemoved: "✅ Favorite items removed:\n%1",
			favList: "📝 Current favorites:\n%1",
			emptyFav: "(empty)",
			invalidFav: "📌 Usage: {pn} fav add/remove Item1 | Item2",
			help: `📌 Garden Horizon Commands

• {pn} on - Start tracking
• {pn} off - Stop tracking
• {pn} fav add Carrot | Watering Can - Add favorite items
• {pn} fav remove Carrot - Remove favorite items`
		}
	},

	onStart: async ({ api, event, args, getLang }) => {
		const senderId = event.senderID;
		const threadId = event.threadID;
		const subcmd = args[0]?.toLowerCase();

		// Handle favorite items
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

			const currentFav = favoriteMap.get(senderId) || [];
			const updated = new Set(currentFav);

			for (const name of input) {
				if (action === "add") updated.add(name);
				else updated.delete(name);
			}

			favoriteMap.set(senderId, Array.from(updated));
			const favList = Array.from(updated).join(", ") || getLang("emptyFav");

			if (action === "add") {
				return api.sendMessage(getLang("favAdded", favList), threadId);
			} else {
				return api.sendMessage(getLang("favRemoved", favList), threadId);
			}
		}

		// Handle stop tracking
		if (subcmd === "off") {
			if (!activeSessions.has(senderId)) {
				return api.sendMessage(getLang("notTracking"), threadId);
			}

			activeSessions.delete(senderId);
			lastSentCache.delete(senderId);
			return api.sendMessage(getLang("trackingStopped"), threadId);
		}

		// Show help if no subcommand or invalid subcommand
		if (subcmd !== "on") {
			const prefix = global.GoatBot.config.prefix;
			return api.sendMessage(getLang("help").replace(/{pn}/g, prefix + "gh"), threadId);
		}

		// Handle start tracking
		if (activeSessions.has(senderId)) {
			return api.sendMessage(getLang("alreadyTracking"), threadId);
		}

		activeSessions.set(senderId, { api, threadID: threadId });
		await api.sendMessage(getLang("trackingStarted"), threadId);
		ensureWebSocketConnection();
	}
};
