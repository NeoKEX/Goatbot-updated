const allOnEvent = global.GoatBot.onEvent;

module.exports = {
	config: {
		name: "onEvent",
		version: "1.1",
		author: "NTKhang",
		description: "Loop to all event in global.GoatBot.onEvent and run when have new event",
		category: "events"
	},

	onStart: async ({ api, args, message, event, threadsData, usersData, dashBoardData, threadModel, userModel, dashBoardModel, role, commandName }) => {
		for (const item of allOnEvent) {
			if (typeof item === "string") {
				continue;
			}
			if (!item || typeof item.onStart !== "function") {
				continue;
			}
			try {
				await item.onStart({ api, args, message, event, threadsData, usersData, threadModel, dashBoardData, userModel, dashBoardModel, role, commandName });
			} catch (error) {
				console.error("[EVENT] Failed to run event hook:", error?.message || error);
			}
		}
	}
};