module.exports = {
	config: {
		name: "supportgc",
		version: "1.0",
		author: "Saifullah Neoaz",
		countDown: 10,
		role: 0,
		description: {
			vi: "Tham gia nhóm hỗ trợ",
			en: "Join support group"
		},
		category: "box chat",
		guide: {
			vi: "   {pn}: tham gia nhóm hỗ trợ của bot",
			en: "   {pn}: join the bot support group"
		}
	},

	langs: {
		vi: {
			joining: "⏳ Đang thêm bạn vào nhóm hỗ trợ...",
			success: "✅ Đã thêm bạn vào nhóm hỗ trợ thành công!\n🔗 Link: https://m.me/j/AbZX5he4yIFsgui_/",
			approval: "⏳ Đã gửi yêu cầu tham gia nhóm hỗ trợ, vui lòng chờ admin phê duyệt!\n🔗 Link: https://m.me/j/AbZX5he4yIFsgui_/",
			alreadyInGroup: "ℹ️ Bạn đã là thành viên của nhóm hỗ trợ rồi!\n🔗 Link: https://m.me/j/AbZX5he4yIFsgui_/",
			error: "❌ Không thể thêm bạn vào nhóm hỗ trợ. Vui lòng liên hệ admin hoặc tham gia qua link:\n🔗 https://m.me/j/AbZX5he4yIFsgui_/",
			blocked: "❌ Bạn có thể đã chặn bot hoặc chặn người lạ thêm vào nhóm. Vui lòng tham gia qua link:\n🔗 https://m.me/j/AbZX5he4yIFsgui_/"
		},
		en: {
			joining: "⏳ Adding you to the support group...",
			success: "✅ Successfully added you to the support group!\n🔗 Link: https://m.me/j/AbZX5he4yIFsgui_/",
			approval: "⏳ Request sent to join the support group, please wait for admin approval!\n🔗 Link: https://m.me/j/AbZX5he4yIFsgui_/",
			alreadyInGroup: "ℹ️ You are already a member of the support group!\n🔗 Link: https://m.me/j/AbZX5he4yIFsgui_/",
			error: "❌ Cannot add you to the support group. Please contact admin or join via link:\n🔗 https://m.me/j/AbZX5he4yIFsgui_/",
			blocked: "❌ You may have blocked the bot or blocked strangers from adding to groups. Please join via link:\n🔗 https://m.me/j/AbZX5he4yIFsgui_/"
		}
	},

	onStart: async function ({ message, api, event, getLang }) {
		const supportGroupThreadID = "8008566255928114";
		const userID = event.senderID;

		try {
			await message.reply(getLang("joining"));

			const threadInfo = await api.getThreadInfo(supportGroupThreadID);
			
			const isMember = threadInfo.participantIDs.includes(userID);
			if (isMember) {
				return message.reply(getLang("alreadyInGroup"));
			}

			await api.addUserToGroup(userID, supportGroupThreadID);
			
			if (threadInfo.approvalMode) {
				return message.reply(getLang("approval"));
			} else {
				return message.reply(getLang("success"));
			}
		}
		catch (err) {
			console.error("SupportGC Error:", err);
			
			if (err.message && err.message.includes("blocked")) {
				return message.reply(getLang("blocked"));
			}
			
			return message.reply(getLang("error"));
		}
	}
};
