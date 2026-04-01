const multiAccountManager = require("../../bot/login/multiAccountManager.js");

module.exports = {
	config: {
		name: "account",
		version: "1.0",
		author: "NeoKEX",
		countDown: 5,
		role: 2, // Bot admin only
		description: {
			en: "Manage multiple accounts and check status"
		},
		category: "system",
		guide: {
			en: "{pn} status - Check multi-account status\n{pn} switch - Switch to next account\n{pn} reset - Reset failed accounts"
		}
	},

	langs: {
		en: {
			statusTitle: "📊 Multi-Account Status",
			totalAccounts: "Total accounts: %1",
			currentAccount: "Current account: %1",
			availableAccounts: "Available accounts: %1",
			failedAccounts: "Failed accounts: %1",
			switchCount: "Switch count: %1",
			canSwitch: "Can switch: %1",
			switching: "🔄 Switching to next account...",
			switchSuccess: "✅ Account switch initiated",
			switchFailed: "❌ Failed to switch account",
			resetSuccess: "✅ Failed accounts reset",
			noPermission: "❌ You don't have permission to use this command",
			invalidUsage: "❌ Invalid usage. Use: status, switch, or reset"
		}
	},

	onStart: async function ({ message, args, getLang }) {
		const action = args[0]?.toLowerCase();

		switch (action) {
			case "status": {
				const stats = multiAccountManager.getStats();
				const statusMsg = [
					getLang("statusTitle"),
					"━━━━━━━━━━━━━━━",
					getLang("totalAccounts", stats.totalAccounts),
					getLang("currentAccount", stats.currentAccount || "None"),
					getLang("availableAccounts", stats.availableAccounts.join(", ") || "None"),
					getLang("failedAccounts", stats.failedAccounts.join(", ") || "None"),
					getLang("switchCount", stats.switchCount),
					getLang("canSwitch", stats.canSwitch ? "Yes" : "No (cooldown)"),
					"━━━━━━━━━━━━━━━"
				].join("\n");
				return await message.reply(statusMsg);
			}

			case "switch": {
				await message.reply(getLang("switching"));
				const { switchToNextAccount } = global.GoatBot.reLoginBot ? 
					require("../../bot/login/login.js") : { switchToNextAccount: null };
				
				if (global.switchToNextAccount) {
					const result = await global.switchToNextAccount("Manual switch by admin");
					if (result) {
						return await message.reply(getLang("switchSuccess"));
					} else {
						return await message.reply(getLang("switchFailed"));
					}
				} else {
					// Fallback: trigger account switch via global
					multiAccountManager.isSwitching = true;
					const nextAccount = multiAccountManager.nextAccount();
					global.client.dirAccount = nextAccount;
					
					setTimeout(() => {
						multiAccountManager.isSwitching = false;
						global.GoatBot.reLoginBot();
					}, 3000);
					
					return await message.reply(getLang("switchSuccess"));
				}
			}

			case "reset": {
				multiAccountManager.resetFailedAccounts();
				return await message.reply(getLang("resetSuccess"));
			}

			default: {
				return await message.reply(getLang("invalidUsage"));
			}
		}
	}
};
