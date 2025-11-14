module.exports = {
        config: {
                name: "pending",
                version: "1.0",
                author: "NeoKEX",
                countDown: 5,
                role: 2,
                description: {
                        vi: "Xem và chấp nhận tin nhắn đang chờ",
                        en: "View and accept pending message requests"
                },
                category: "admin",
                guide: {
                        vi: '   {pn}: Xem danh sách tin nhắn đang chờ'
                                + '\n   {pn} accept <threadID>: Chấp nhận tin nhắn từ thread cụ thể'
                                + '\n   {pn} acceptall: Chấp nhận tất cả tin nhắn đang chờ',
                        en: '   {pn}: View list of pending messages'
                                + '\n   {pn} accept <threadID>: Accept message from specific thread'
                                + '\n   {pn} acceptall: Accept all pending messages'
                }
        },

        langs: {
                vi: {
                        pendingList: "📬 Danh sách tin nhắn đang chờ (%1):\n\n%2\n\nDùng {pn} accept <threadID> để chấp nhận",
                        noPending: "📭 Không có tin nhắn đang chờ nào",
                        accepted: "✅ Đã chấp nhận tin nhắn từ thread: %1",
                        acceptedAll: "✅ Đã chấp nhận %1 tin nhắn đang chờ",
                        error: "❌ Đã xảy ra lỗi: %1",
                        missingThreadID: "⚠️ Vui lòng nhập threadID"
                },
                en: {
                        pendingList: "📬 Pending message list (%1):\n\n%2\n\nUse {pn} accept <threadID> to accept",
                        noPending: "📭 No pending messages",
                        accepted: "✅ Accepted message from thread: %1",
                        acceptedAll: "✅ Accepted %1 pending messages",
                        error: "❌ An error occurred: %1",
                        missingThreadID: "⚠️ Please enter threadID"
                }
        },

        onStart: async function ({ api, message, args, getLang, commandName }) {
                try {
                        const spam = await api.getThreadList(100, null, ["PENDING"]);
                        const pending = await api.getThreadList(100, null, ["OTHER"]);
                        const list = [...spam, ...pending].filter(thread => thread.isGroup == false);
                        
                        if (list.length === 0)
                                return message.reply(getLang("noPending"));
                        
                        if (args[0] === "accept") {
                                if (!args[1])
                                        return message.reply(getLang("missingThreadID"));
                                
                                const threadID = args[1];
                                await api.sendMessage("✅ Message request accepted", threadID);
                                return message.reply(getLang("accepted", threadID));
                        } else if (args[0] === "acceptall") {
                                let count = 0;
                                for (const thread of list) {
                                        try {
                                                await api.sendMessage("✅ Message request accepted", thread.threadID);
                                                count++;
                                        } catch (err) {
                                                console.error(`Error accepting thread ${thread.threadID}:`, err);
                                        }
                                }
                                return message.reply(getLang("acceptedAll", count));
                        } else {
                                const msg = list.map((thread, i) => 
                                        `${i + 1}. ${thread.name || "Unnamed"} (${thread.threadID})`
                                ).join("\n");
                                
                                return message.reply(getLang("pendingList", list.length, msg).replace(/{pn}/g, `${message.prefix || ""}${commandName}`));
                        }
                } catch (err) {
                        console.error("Error in pending command:", err);
                        return message.reply(getLang("error", err.message));
                }
        }
};