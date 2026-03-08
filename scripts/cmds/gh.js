const WebSocket = require("ws");

const activeSessions = new Map();
const lastSentCache = new Map();
const favoriteMap = new Map();

let sharedWebSocket = null;
let keepAliveInterval = null;
let botApi = null;
let botClient = null;

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
	return items
		.filter(i => i.quantity > 0)
		.map(i => `- ${i.emoji ? i.emoji + " " : ""}${i.name}: ${formatValue(i.quantity)}`)
		.join("\n");
}

function sendAutoMessage(senderId, messageText) {
	if (!botApi) {
		console.log("[GHZ] No API available");
		return;
	}
	
	try {
		// Send message to user
		botApi.sendMessage(messageText, senderId, (err) => {
			if (err) {
				console.log("[GHZ] Send error:", err);
			}
		});
		console.log(`[GHZ] Sent message to ${senderId}`);
	} catch (e) {
		console.log("[GHZ] Send exception:", e.message);
	}
}

function ensureWebSocketConnection() {
	if (sharedWebSocket && sharedWebSocket.readyState === WebSocket.OPEN) {
		console.log("[GHZ] WebSocket already connected");
		return;
	}

	console.log("[GHZ] Connecting to WebSocket...");
	sharedWebSocket = new WebSocket("wss://gagstock.gleeze.com/ghz");

	sharedWebSocket.on("open", () => {
		console.log("[GHZ] WebSocket connected!");
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

			console.log("[GHZ] Received data:", JSON.stringify(payload).substring(0, 200));

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
					? `🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿: ${weather.status}\n📋 ${weather.description}\n🕒 Start: ${weather.startTime}\n🕒 End: ${weather.endTime}`
					: "";

				const updatedAt = payload.lastUpdated || getPHTime().toLocaleString("en-PH");

				const title = favList.length > 0
					? `❤️ ${matchCount} 𝗙𝗮𝘃𝗼𝗿𝗶𝘁𝗲 𝗜𝘁𝗲𝗺${matchCount > 1 ? "s" : ""} 𝗙𝗼𝘂𝗻𝗱!`
					: "🌾 𝗚𝗮𝗲𝗻 𝗿𝗱𝗛𝗼𝗿𝗶𝘇𝗼𝗻 — 𝗦𝘁𝗼𝗰𝗸";

				const messageKey = JSON.stringify({ title, sections, weatherInfo, updatedAt });
				const lastSent = lastSentCache.get(senderId);

				if (lastSent === messageKey) continue;
				lastSentCache.set(senderId, messageKey);

				const fullMessage = `${title}\n\n${sections.join("\n\n")}\n\n${weatherInfo}\n\n📅 Updated: ${updatedAt}`;
				console.log(`[GHZ] Sending to ${senderId}:`, fullMessage.substring(0, 100));
				
				sendAutoMessage(senderId, fullMessage);
			}
		} catch (e) {
			console.log("[GHZ] Parse error:", e.message);
		}
	});

	sharedWebSocket.on("close", () => {
		console.log("[GHZ] WebSocket closed, reconnecting...");
		clearInterval(keepAliveInterval);
		sharedWebSocket = null;
		setTimeout(ensureWebSocketConnection, 3000);
	});

	sharedWebSocket.on("error", (err) => {
		console.log("[GHZ] WebSocket error:", err.message);
		sharedWebSocket?.close();
	});
}

module.exports = {
	config: {
		name: "ghz",
		aliases: ["gardenhorizon", "garden"],
		version: "2.0",
		author: "Neoaz ゐ",
		countDown: 10,
		role: 0,
		shortDescription: { en: "Garden Horizon live stock tracker" },
		longDescription: { en: "Track Garden Horizon game items via WebSocket with auto-notifications" },
		category: "game",
		guide: {
			en: "{pn} on - Start tracking\n{pn} off - Stop tracking\n{pn} fav add Item1 | Item2 - Add favorites\n{pn} fav remove Item1 | Item2 - Remove favorites"
		}
	},

	onStart: async function ({ message, args, api, event }) {
		// Store the API for WebSocket to use
		botApi = api;
		console.log("[GHZ] API stored, botID:", global.botID);

		const senderId = event.senderID;
		const subcmd = args[0]?.toLowerCase();

		// Handle favorites
		if (subcmd === "fav") {
			const action = args[1]?.toLowerCase();
			const input = args.slice(2)
				.join(" ")
				.split("|")
				.map(i => cleanText(i))
				.filter(Boolean);

			if (!action || !["add", "remove"].includes(action) || input.length === 0) {
				return message.reply("📌 Usage:\n• ghz fav add Carrot | Watering Can\n• ghz fav remove Carrot");
			}

			const currentFav = favoriteMap.get(senderId) || [];
			const updated = new Set(currentFav);

			for (const name of input) {
				if (action === "add") updated.add(name);
				else updated.delete(name);
			}

			favoriteMap.set(senderId, Array.from(updated));

			return message.reply(`✅ Favorite list updated:\n${Array.from(updated).join(", ") || "(empty)"}`);
		}

		// Turn off tracking
		if (subcmd === "off") {
			if (!activeSessions.has(senderId)) {
				return message.reply("⚠️ You don't have an active ghz session.");
			}

			activeSessions.delete(senderId);
			lastSentCache.delete(senderId);

			return message.reply("🛑 Garden Horizon tracking stopped.");
		}

		// Start tracking
		if (subcmd === "on" || !subcmd) {
			if (activeSessions.has(senderId)) {
				return message.reply("📡 You're already tracking Garden Horizon.\nUse ghz off to stop.");
			}

			activeSessions.set(senderId, { 
				pageAccessToken: null,
				threadID: event.threadID 
			});
			
			ensureWebSocketConnection();

			return message.reply("✅ Garden Horizon tracking started!\n🔔 You'll receive notifications when items are in stock.");
		}

		// Show current stock status
		if (subcmd === "status" || subcmd === "stock") {
			if (!activeSessions.has(senderId)) {
				return message.reply("⚠️ You need to start tracking first. Use: ghz on");
			}
			
			// Request current stock by sending a ping (the WebSocket should respond)
			return message.reply("📊 Checking current stock...");
		}

		// Show help
		return message.reply(
			`📌 Garden Horizon Commands\n\n` +
			`• ghz on - Start tracking\n` +
			`• ghz off - Stop tracking\n` +
			`• ghz fav add Item1 | Item2 - Add favorites\n` +
			`• ghz fav remove Item1 | Item2 - Remove favorites`
		);
	},

	// Handle chat - check if tracking is on
	onChat: async function ({ api, event, message }) {
		const senderId = event.senderID;

		// Check if user has tracking enabled
		if (!activeSessions.has(senderId)) return;

		// Skip if message is from the bot itself
		if (event.senderID === global.botID) return;
	}
};
