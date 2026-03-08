const axios = require("axios");

module.exports = {
	config: {
		name: "sim",
		aliases: ["simsimi", "chatbot", "chat"],
		version: "1.0.0",
		author: "Developer",
		role: 0,
		shortDescription: {
			en: "Talk with the SimSimi API"
		},
		longDescription: {
			en: "Chat with SimSimi AI and get automated responses"
		},
		category: "ai",
		guide: {
			en: "{pn} [message] - Chat with SimSimi\n{pn} on - Enable bot responses\n{pn} off - Disable bot responses"
		},
		countDown: 3
	},

	onStart: async function ({ api, event, args, message, prefix }) {
		const action = args[0]?.toLowerCase();
		const globalData = global.GoatBot.globalData || {};

		// Initialize sim data if not exists
		if (!globalData.sim) {
			globalData.sim = { enable: true };
		}

		// Toggle on/off
		if (action === "on") {
			globalData.sim.enable = true;
			global.GoatBot.globalData = globalData;
			return message.reply("✅ SimSimi chatbot has been enabled!");
		}

		if (action === "off") {
			globalData.sim.enable = false;
			global.GoatBot.globalData = globalData;
			return message.reply("❌ SimSimi chatbot has been disabled!");
		}

		// Check if sim is enabled
		if (!globalData.sim.enable) {
			return message.reply("❌ SimSimi chatbot is currently disabled.\n💡 Use: " + prefix + "sim on to enable it.");
		}

		const query = args.join(" ").trim();

		if (!query) {
			return message.reply("❌ Please provide a message.\n📝 Usage: " + prefix + "sim [message]\n💡 Example: " + prefix + "sim Hello!");
		}

		const sendingMsg = await message.reply("🤔 Thinking...");

		try {
			const apiKey = "2a5a2264d2ee4f0b847cb8bd809ed34bc3309be7";
			const apiUrl = `https://simsimi.ooguy.com/sim?query=${encodeURIComponent(query)}&apikey=${apiKey}`;
			const { data } = await axios.get(apiUrl);

			if (!data || !data.respond) {
				return message.reply("❌ Error: No response from Sim API.");
			}

			return message.reply(data.respond);
		} catch (error) {
			console.error("Sim command error:", error.message);
			return message.reply("❌ Error: Failed to connect to Sim API.\n" + error.message);
		}
	},

	// Handle auto responses when enabled
	onChat: async function ({ api, event, message, globalData }) {
		// Initialize sim data if not exists
		if (!globalData.sim) {
			globalData.sim = { enable: true };
		}

		// Check if sim is enabled
		if (!globalData.sim.enable) return;

		// Skip if message is from the bot itself (prevent infinite loop)
		if (event.senderID === global.botID) return;

		// Get message content (skip if command)
		const text = event.body?.trim();
		if (!text || text.startsWith(global.GoatBot.config.prefix)) return;

		// Skip if message is too short
		if (text.length < 2) return;

		// Optional: Add some randomness to avoid responding to every message
		// Uncomment below to make it respond randomly (30% chance)
		// if (Math.random() > 0.3) return;

		try {
			const apiKey = "2a5a2264d2ee4f0b847cb8bd809ed34bc3309be7";
			const apiUrl = `https://simsimi.ooguy.com/sim?query=${encodeURIComponent(text)}&apikey=${apiKey}`;
			const { data } = await axios.get(apiUrl);

			if (data && data.respond) {
				return message.reply(data.respond);
			}
		} catch (error) {
			// Silently fail for auto-responses
			console.error("Sim auto-response error:", error.message);
		}
	}
};
