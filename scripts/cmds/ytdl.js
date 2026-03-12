const axios = require("axios");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream/promises");
const ytSearch = require("yt-search");

const API_URL = "https://api.nixhost.top/aryan/yx";

function extractVideoId(url) {
	try {
		const urlObj = new URL(url);
		if (urlObj.hostname === "youtu.be") {
			return urlObj.pathname.slice(1);
		} else if (urlObj.hostname.includes("youtube.com")) {
			const urlParams = new URLSearchParams(urlObj.search);
			return urlParams.get("v");
		}
		return null;
	} catch {
		return null;
	}
}

function cleanUrl(url) {
	// Convert shorts to regular URL
	const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
	if (shortsMatch) {
		return `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
	}
	// Extract video ID and create clean URL
	const videoId = extractVideoId(url);
	if (videoId) {
		return `https://www.youtube.com/watch?v=${videoId}`;
	}
	return url;
}

module.exports = {
	config: {
		name: "ytdl",
		version: "1.0.0",
		author: "Jonell Magallanes",
		countDown: 5,
		role: 0,
		shortDescription: { en: "Download YouTube video" },
		longDescription: { en: "Download YouTube video or audio" },
		category: "media",
		guide: {
			en: "{pn} <title> - Search and download\n{pn} <url> - Download video"
		}
	},

	onStart: async function ({ message, args, event, api }) {
		let videoId, topResult;

		const processingMsg = await message.reply("🔍 Searching...");

		try {
			// Check if first arg is a URL
			const isUrl = /^https?:\/\//.test(args[0]);

			if (isUrl) {
				// It's a URL
				const cleanInputUrl = cleanUrl(args[0]);
				videoId = extractVideoId(cleanInputUrl);
				if (!videoId) {
					await message.reply("❌ Invalid YouTube URL.");
					return;
				}

				const searchResults = await ytSearch(videoId);
				if (!searchResults || !searchResults.videos.length) {
					await message.reply("❌ No results found.");
					return;
				}
				topResult = searchResults.videos[0];
			} else {
				// Search by name
				const query = args.join(" ");
				if (!query) {
					await message.reply("❌ Please enter a title or YouTube URL.");
					return;
				}

				const searchResults = await ytSearch(query);
				if (!searchResults || !searchResults.videos.length) {
					await message.reply("❌ No results found.");
					return;
				}
				topResult = searchResults.videos[0];
				videoId = topResult.videoId;
			}

			// Check video length (max 10 minutes)
			const timestamp = topResult.timestamp;
			const parts = timestamp.split(":").map(Number);
			const durationSeconds = parts.length === 3
				? parts[0] * 3600 + parts[1] * 60 + parts[2]
				: parts[0] * 60 + parts[1];

			if (durationSeconds > 600) {
				await message.reply("⚠️ This video is too long. Only videos under 10 minutes are supported.");
				return;
			}

			await message.unsend(processingMsg.messageID);
			await message.reaction("⏳", event.messageID);

			// Use NixHost API
			const cleanVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
			const apiUrl = `${API_URL}?url=${encodeURIComponent(cleanVideoUrl)}&type=mp4`;

			const downloadResponse = await axios.get(apiUrl, { timeout: 30000 });
			const data = downloadResponse.data;

			if (!data || !data.download_url) {
				message.reaction("❌", event.messageID);
				await message.reply("❌ Failed to get video download link.");
				return;
			}

			const title = topResult.title;
			const quality = "Auto";
			const download_url = data.download_url;

			// Shorten the download URL
			let shortLink = download_url;
			try {
				const shortApiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(download_url)}`;
				const shortResponse = await axios.get(shortApiUrl, { timeout: 10000 });
				if (shortResponse.data && shortResponse.data.length < download_url.length) {
					shortLink = shortResponse.data;
				}
			} catch (e) {
				console.log("[YTDL] Could not shorten URL");
			}

			// Download and send as file
			const tmpFile = path.join(os.tmpdir(), `ytdl_${Date.now()}.mp4`);
			
			const fileResponse = await axios.get(download_url, {
				responseType: "stream",
				timeout: 120000,
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					"Referer": "https://www.youtube.com/"
				}
			});

			await pipeline(fileResponse.data, fs.createWriteStream(tmpFile));

			message.reaction("✅", event.messageID);

			const videoInfo = `🎬 𝐘𝐎𝐔𝐓𝐔𝐁𝐄 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃

━━━━━━━━━━━━━━━
📌 Title: ${title}
📊 Quality: ${quality}
⏱️ Duration: ${timestamp}
📺 Channel: ${topResult.author.name}
━━━━━━━━━━━━━━━

💾 Type "dl" or "download" to get the raw stream link.`;

			const sentMessage = await message.reply({
				body: videoInfo,
				attachment: fs.createReadStream(tmpFile)
			});

			// Cleanup
			fs.unlink(tmpFile).catch(() => {});

			// Register the reply event for 'dl'
			global.GoatBot.onReply.set(sentMessage.messageID, {
				commandName: this.config.name,
				messageID: sentMessage.messageID,
				author: event.senderID,
				downloadUrl: download_url
			});

		} catch (error) {
			console.error("[YTDL] Error:", error.message);
			message.reaction("❌", event.messageID);
			
			// If download fails, just send the link
			if (error.response?.status === 403 || error.response?.status === 404 || error.message.includes("size")) {
				try {
					const cleanVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
					const apiUrl = `${API_URL}?url=${encodeURIComponent(cleanVideoUrl)}&type=mp4`;
					const downloadResponse = await axios.get(apiUrl, { timeout: 30000 });
					const data = downloadResponse.data;
					
					if (data?.download_url) {
						// Try to shorten URL
						let shortLink = data.download_url;
						try {
							const shortApiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(data.download_url)}`;
							const shortResponse = await axios.get(shortApiUrl, { timeout: 10000 });
							if (shortResponse.data && shortResponse.data.length < data.download_url.length) {
								shortLink = shortResponse.data;
							}
						} catch {}
						
						await message.reply(`🎬 ${topResult?.title || "Video"} is too large to send directly! \n\n📥 You can watch/download it here: ${shortLink}`);
						message.reaction("✅", event.messageID);
						return;
					}
				} catch {}
			}
			
			await message.reply(`❌ Error: ${error.message}`);
		} finally {
			try {
				await message.unsend(processingMsg.messageID);
			} catch {}
		}
	},

	onReply: async function ({ api, message, event, Reply }) {
		if (event.senderID !== Reply.author) return;

		const { body } = event;
		const messageText = body.toLowerCase().trim();

		if (messageText === "dl" || messageText === "download") {
			// Shorten the download URL for the reply if it wasn't already shortened
			let shortLink = Reply.downloadUrl;
			try {
				const shortApiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(Reply.downloadUrl)}`;
				const shortResponse = await axios.get(shortApiUrl, { timeout: 10000 });
				if (shortResponse.data && shortResponse.data.length < shortLink.length) {
					shortLink = shortResponse.data;
				}
			} catch (e) {
				console.log("[YTDL] Could not shorten URL");
			}

			const downloadMessage = await message.reply(`📥 Download URL:\n${shortLink}`);
			
			// Unsend the download link after 50 seconds
			setTimeout(async () => {
				try {
					api.unsendMessage(downloadMessage.messageID);
				} catch (e) {}
			}, 50000);
		}
	}
};
