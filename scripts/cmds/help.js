const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "help",
		aliases: ["menu", "commands", "cmds", "h"],
		version: "5.0",
		author: "Ry",
		shortDescription: "Show all available commands",
		longDescription: "Displays a clean and premium-styled categorized list of commands with pagination support.",
		category: "system",
		guide: "{pn}help [page number | command name | all]"
	},

	onStart: async function ({ message, args, prefix }) {
		const allCommands = global.GoatBot.commands;
		const categories = {};

		const emojiMap = {
			ai: "🤖", "ai-image": "🖼️", group: "👥", system: "⚙️",
			fun: "🎮", owner: "👑", config: "🔧", economy: "💰",
			media: "📺", "18+": "🔞", tools: "🛠️", utility: "📌",
			info: "ℹ️", image: "🖌️", game: "🎲", admin: "🛡️",
			rank: "🏆", boxchat: "📦", others: "📁", other: "📁"
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

		for (const [name, cmd] of allCommands) {
			const cat = cleanCategoryName(cmd.config.category);
			if (!categories[cat]) categories[cat] = [];
			categories[cat].push(cmd.config.name);
		}

		// Handle "help all" - show all commands in one message
		if (args[0] && args[0].toLowerCase() === "all") {
			let allMsg = `🪪 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧 𝗕𝗢𝗧\n`;
			allMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
			allMsg += `📋 𝗔𝗟𝗟 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 (${allCommands.size} total):\n\n`;

			const sortedCategories = Object.keys(categories).sort();
			for (const cat of sortedCategories) {
				const emoji = emojiMap[cat] || "➥";
				allMsg += `${emoji} ${cat.toUpperCase()}:\n`;
				allMsg += `  ${categories[cat].sort().join(", ")}\n\n`;
			}

			allMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
			allMsg += `💡 Use: ${prefix}help <command name> for details`;

			return message.reply(allMsg);
		}

		// Display detailed command information if a specific command is provided
		if (args[0] && isNaN(args[0])) {
			const query = args[0].toLowerCase();
			const cmd =
				allCommands.get(query) ||
				[...allCommands.values()].find((c) => (c.config.aliases || []).includes(query));

			if (!cmd) {
				return message.reply(`❌ Command "${args[0]}" not found.\n💡 Use: ${prefix}help to see all commands.`);
			}

			const {
				name,
				version,
				author,
				guide,
				category,
				shortDescription,
				longDescription,
				aliases,
				role
			} = cmd.config;

			const desc =
				typeof longDescription === "string"
					? longDescription
					: longDescription?.en || shortDescription?.en || shortDescription || "No description";

			const usage =
				typeof guide === "string"
					? guide.replace(/{pn}/g, prefix)
					: guide?.en?.replace(/{pn}/g, prefix) || `${prefix}${name}`;

			const permissionLevels = {
				0: "Everyone",
				1: "Group Admins",
				2: "Bot Admins",
				3: "Bot Owner"
			};
			const requiredRole = permissionLevels[role] !== undefined ? permissionLevels[role] : `Role ${role}`;

			const detailsMsg =
				`📚 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢\n` +
				`━━━━━━━━━━━━━━━━━━━━\n\n` +
				`➤ ɴᴀᴍᴇ: ${name}\n` +
				`➤ ᴄᴀᴛᴇɢᴏʀʏ: ${category || "Uncategorized"}\n` +
				`➤ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ: ${desc}\n` +
				`➤ ᴀʟɪᴀsᴇs: ${aliases?.length ? aliases.join(", ") : "None"}\n` +
				`➤ ᴜsᴀɢᴇ: ${usage}\n` +
				`➤ ᴘᴇʀᴍɪssɪᴏɴ: ${requiredRole}\n` +
				`➤ ᴀᴜᴛʜᴏʀ: ${author || "Unknown"}\n` +
				`➤ ᴠᴇʀsɪᴏɴ: ${version || "1.0.0"}\n\n` +
				`━━━━━━━━━━━━━━━━━━━━`;

			return message.reply(detailsMsg);
		}

		// Handle page navigation
		const pageSize = 25;
		const totalCommands = Object.values(categories).flat().length;
		const pageIndex = args[0] ? parseInt(args[0], 10) : 1;

		if (isNaN(pageIndex) || pageIndex < 1) {
			return message.reply(`❌ Invalid page number.\n💡 Use: ${prefix}help [page number]`);
		}

		const sortedCategories = Object.keys(categories).sort();
		let allCmdsList = [];
		for (const cat of sortedCategories) {
			allCmdsList = allCmdsList.concat(categories[cat].sort().map(cmd => ({ category: cat, name: cmd })));
		}

		const totalPages = Math.ceil(allCmdsList.length / pageSize);

		if (pageIndex > totalPages) {
			return message.reply(`❌ Page ${pageIndex} does not exist.\n📊 Total pages: ${totalPages} | Total commands: ${totalCommands}`);
		}

		const startIdx = (pageIndex - 1) * pageSize;
		const endIdx = Math.min(startIdx + pageSize, allCmdsList.length);
		const pageCmds = allCmdsList.slice(startIdx, endIdx);

		// Group commands by category for display
		const pageCategories = {};
		for (const cmd of pageCmds) {
			if (!pageCategories[cmd.category]) pageCategories[cmd.category] = [];
			pageCategories[cmd.category].push(cmd.name);
		}

		let msg = `🪪 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧 𝗕𝗢𝗧\n`;
		msg += `━━━━━━━━━━━━━━━━━━━━\n`;
		msg += `📋 𝗔𝗩𝗔𝗜𝗟𝗔𝗕𝗟𝗘 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦\n`;
		msg += `📄 Page ${pageIndex}/${totalPages} | Total: ${totalCommands}\n`;
		msg += `━━━━━━━━━━━━━━━━━━━━\n`;

		for (const cat of sortedCategories) {
			if (pageCategories[cat]) {
				const emoji = emojiMap[cat] || "➥";
				msg += `\n${emoji} ${cat.toUpperCase()}:\n`;
				msg += `  ${pageCategories[cat].join(" | ")}\n`;
			}
		}

		msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;

		// Navigation buttons
		const nav = [];
		if (pageIndex > 1) nav.push(`◀️ Prev: ${prefix}help ${pageIndex - 1}`);
		if (pageIndex < totalPages) nav.push(`▶️ Next: ${prefix}help ${pageIndex + 1}`);

		if (nav.length > 0) msg += nav.join(" | ") + "\n";

		msg += `\n💡 𝗧𝗜𝗣𝗚𝗦:\n`;
		msg += `   🔍 ${prefix}help <command name> - Details\n`;
		msg += `   📋 ${prefix}help all - All commands\n`;
		msg += `   📞 ${prefix}callad - Contact admins`;

		return message.reply(msg);
	}
};
