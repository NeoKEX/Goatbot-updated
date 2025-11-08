const fs = require("fs-extra");
const path = require("path");
const https = require("https");

module.exports = {
	config: {
		name: "help",
		aliases: ["menu", "commands"],
		version: "4.8",
		author: "NeoKEX",
		shortDescription: "Show all available commands",
		longDescription: "Displays a clean and premium-styled categorized list of commands.",
		category: "system",
		guide: "{pn}help [command name]"
	},

	onStart: async function ({ message, args, prefix }) {
		const allCommands = global.GoatBot.commands;
		const categories = {};

		const emojiMap = {
			ai: "➥", "ai-image": "➥", group: "➥", system: "➥",
			fun: "➥", owner: "➥", config: "➥", economy: "➥",
			media: "➥", "18+": "➥", tools: "➥", utility: "➥",
			info: "➥", image: "➥", game: "➥", admin: "➥",
			rank: "➥", boxchat: "➥", others: "➥"
		};

		const cleanCategoryName = (text) => {
			if (!text) return "others";
			return text
				.normalize("NFKD")
				.replace(/[^\w\s-]/g, "")
				.replace(/\s+/g, " ")
				.trim()
				.toLowerCase();
		};

		// Group commands by category
		for (const [name, cmd] of allCommands) {
			const cat = cleanCategoryName(cmd.config.category);
			if (!categories[cat]) categories[cat] = [];
			categories[cat].push(cmd.config.name);
		}

		// GIF URLs
		const gifURLs = [
			"https://i.imgur.com/ejqdK51.gif",
			"https://i.imgur.com/ltIztKe.gif",
			"https://i.imgur.com/5oqrQ0i.gif",
			"https://i.imgur.com/qf2aZH8.gif",
			"https://i.imgur.com/3QzYyye.gif",
			"https://i.imgur.com/ffxzucB.gif",
			"https://i.imgur.com/3QSsSzA.gif",
			"https://i.imgur.com/Ih819LH.gif"
		];

		// pick random gif
		const randomGifURL = gifURLs[Math.floor(Math.random() * gifURLs.length)];
		const gifFolder = path.join(__dirname, "cache");
		if (!fs.existsSync(gifFolder)) fs.mkdirSync(gifFolder, { recursive: true });
		const gifName = path.basename(randomGifURL);
		const gifPath = path.join(gifFolder, gifName);

		// download if not exists
		if (!fs.existsSync(gifPath)) {
			await downloadGif(randomGifURL, gifPath);
		}

		// Single command detail
		if (args[0]) {
			const query = args[0].toLowerCase();
			const cmd =
				allCommands.get(query) ||
				[...allCommands.values()].find((c) => (c.config.aliases || []).includes(query));
			if (!cmd) return message.reply(`❌ Command "${query}" not found.`);

			const {
				name,
				version,
				author,
				guide,
				category,
				shortDescription,
				longDescription,
				aliases
			} = cmd.config;

			const desc =
				typeof longDescription === "string"
					? longDescription
					: longDescription?.en || shortDescription?.en || shortDescription || "No description";

			const usage =
				typeof guide === "string"
					? guide.replace(/{pn}/g, prefix)
					: guide?.en?.replace(/{pn}/g, prefix) || `${prefix}${name}`;

			return message.reply({
				body:
					`☠️ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 ☠️\n\n` +
					`➥ Name: ${name}\n` +
					`➥ Category: ${category || "Uncategorized"}\n` +
					`➥ Description: ${desc}\n` +
					`➥ Aliases: ${aliases?.length ? aliases.join(", ") : "None"}\n` +
					`➥ Usage: ${usage}\n` +
					`➥ Author: ${author || "Unknown"}\n` +
					`➥ Version: ${version || "1.0"}`,
				attachment: fs.createReadStream(gifPath)
			});
		}

		// Format all commands
		const formatCommands = (cmds) =>
			cmds.sort().map((cmd) => `│ ∘ ${cmd}`).join("\n");

		let msg = `╭━ 🎯 𝑪𝑶𝑴𝑴𝑨𝑵𝑫𝑺 ━╮\n`;
		const sortedCategories = Object.keys(categories).sort();
		for (const cat of sortedCategories) {
			const emoji = emojiMap[cat] || "➥";
			msg += `\n${emoji} ${cat.toUpperCase()}\n`;
			msg += `${formatCommands(categories[cat])}\n`;
		}
		msg += `\n╰➤ Use: ${prefix}help [command name] for details`;

		return message.reply({
			body: msg,
			attachment: fs.createReadStream(gifPath)
		});
	}
};

// helper to download GIF
function downloadGif(url, dest) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		https.get(url, (res) => {
			if (res.statusCode !== 200) {
				fs.unlink(dest, () => {});
				return reject(new Error(`Failed to download '${url}' (${res.statusCode})`));
			}
			res.pipe(file);
			file.on("finish", () => file.close(resolve));
		}).on("error", (err) => {
			fs.unlink(dest, () => {});
			reject(err);
		});
	});
}