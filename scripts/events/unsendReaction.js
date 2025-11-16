module.exports = {
        config: {
                name: "unsendReaction",
                version: "1.1",
                author: "NeoKEX",
                category: "events",
                description: "Unsend bot messages when bot developers/admins react with 😠 or 😡"
        },

        onStart: async ({ api, event }) => {
                if (event.type !== "message_reaction") {
                        return;
                }

                const targetReactions = ["😠", "😡"];
                if (!targetReactions.includes(event.reaction)) {
                        return;
                }

                const adminBot = (global.GoatBot?.config?.adminBot || []).map(id => String(id));
                const botDevelopers = (global.GoatBot?.config?.botDevelopers || []).map(id => String(id));
                const reactorID = String(event.userID || event.senderID);
                
                if (!adminBot.includes(reactorID) && !botDevelopers.includes(reactorID)) {
                        return;
                }

                return async () => {
                        try {
                                await api.unsendMessage(event.messageID);
                        } catch (error) {
                        }
                };
        }
};