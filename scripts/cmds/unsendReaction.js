module.exports = {
        config: {
                name: "unsendReaction",
                version: "1.0",
                author: "NeoKEX",
                role: 0,
                description: "Unsend bot messages when bot admin reacts with 😠 or 😡",
                category: "system",
                guide: "Bot admin can react with 😠 or 😡 on bot's messages to unsend them"
        },

        onStart: async () => {
                // This command runs in the background via onAnyEvent
                // No direct user interaction needed
        },

        onAnyEvent: async function ({ api, event }) {
                try {
                        // Only process message_reaction events
                        if (event.type !== "message_reaction") {
                                return;
                        }

                        // Check if reaction is 😠 or 😡
                        const targetReactions = ["😠", "😡"];
                        if (!targetReactions.includes(event.reaction)) {
                                return;
                        }

                        // Check if the user who reacted is a bot admin
                        const adminBot = (global.GoatBot.config.adminBot || []).map(id => String(id));
                        const reactorID = String(event.userID || event.senderID);
                        
                        if (!adminBot.includes(reactorID)) {
                                return;
                        }

                        // Try to unsend the message (API will only allow unsending messages sent by the bot)
                        await api.unsendMessage(event.messageID);
                } catch (error) {
                        // Silently fail if message can't be unsent (e.g., not sent by bot)
                }
        }
};