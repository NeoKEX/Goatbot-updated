const axios = require("axios");
const yts = require("yt-search");

module.exports = {
	config: {
		name: "musicdl",
		version: "1.0.1",
		author: ["lianecagara", "Jonell-Magallanes", "VincentSensei",],
		description: "Play and Download YouTube Music",
		category: "media",
		usage: "music <song name>",
		guide: {
			en: "{pn} <song name> - Search and play music from YouTube"
		}
	},

	onStart: async function ({ message, event, args, prefix }) {
		console.log("[Music] Command triggered with args:", args);

		const query = args.join(" ");

		if (!query) {
			return message.reply("❌ Please provide a song name to search.");
		}

		const processingMsg = await message.reply("🔍 Searching...");

		try {
			console.log("[Music] Searching YouTube for:", query);
			const search = await yts(query);
			console.log("[Music] Found", search.videos?.length, "videos");

			if (!search.videos || search.videos.length === 0) {
				await message.reply("❌ No results found.");
				await message.unsend(processingMsg.messageID);
				return;
			}

			const video = search.videos[0];
			const url = video.url;

			console.log("[Music] Getting download URL for:", video.title);
			const apiUrl = `https://ccproject.serv00.net/ytdl2.php`;
			const res = await axios.get(apiUrl, {
				params: { url },
				timeout: 30000
			});

			const { download } = res.data;
			console.log("[Music] Download URL:", download);

			if (!download) {
				await message.reply("❌ Could not get download URL.");
				await message.unsend(processingMsg.messageID);
				return;
			}

			const musicInfo = `🎵  𝐌𝐔𝐒𝐈𝐂 𝐏𝐋𝐀𝐘𝐄𝐑

━━━━━━━━━━━━━━━━━━━━
🎶 Title: ${video.title}
👤 Author: ${video.author.name}
⏱️ Duration: ${video.timestamp}
🔗 YouTube: ${video.url}
━━━━━━━━━━━━━━━━━━━━

📥 Download: ${download}

💬 Reply with "dl" or "download" to get the link again!`;

			const sentMessage = await message.reply(musicInfo);
			console.log("[Music] Message sent successfully");

			global.GoatBot.onReply.set(sentMessage.messageID, {
				commandName: this.config.name,
				author: event.senderID,
				downloadUrl: download
			});

			await message.unsend(processingMsg.messageID);

		} catch (error) {
			console.error("[Music Command] Error:", error.message);
			await message.reply(`❌ Error: ${error.message}`);
			try {
				await message.unsend(processingMsg.messageID);
			} catch {}
		}
	},

	onReply: async function ({ message, event, Reply }) {
		if (event.senderID !== Reply.author) return;

		const { body } = event;
		const messageText = body.toLowerCase().trim();

		if (messageText === "dl" || messageText === "download") {
			await message.reply(`📥 Download Link:\n${Reply.downloadUrl}`);
		}
	}
};
