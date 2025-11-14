module.exports = {
        config: {
                name: "accept",
                version: "1.0",
                author: "Assistant",
                countDown: 5,
                role: 2,
                description: {
                        vi: "Chấp nhận lời mời kết bạn",
                        en: "Accept friend requests"
                },
                category: "admin",
                guide: {
                        vi: '   {pn}: Chấp nhận tất cả lời mời kết bạn đang chờ'
                                + '\n   {pn} <uid>: Chấp nhận lời mời kết bạn từ UID cụ thể',
                        en: '   {pn}: Accept all pending friend requests'
                                + '\n   {pn} <uid>: Accept friend request from specific UID'
                }
        },

        langs: {
                vi: {
                        acceptedAll: "✅ Đã chấp nhận %1 lời mời kết bạn",
                        acceptedOne: "✅ Đã chấp nhận lời mời kết bạn từ %1",
                        noRequests: "📭 Không có lời mời kết bạn nào đang chờ",
                        error: "❌ Đã xảy ra lỗi: %1",
                        notFound: "⚠️ Không tìm thấy lời mời kết bạn từ UID này"
                },
                en: {
                        acceptedAll: "✅ Accepted %1 friend requests",
                        acceptedOne: "✅ Accepted friend request from %1",
                        noRequests: "📭 No pending friend requests",
                        error: "❌ An error occurred: %1",
                        notFound: "⚠️ Friend request from this UID not found"
                }
        },

        onStart: async function ({ api, message, args, getLang }) {
                try {
                        const friendRequests = global.GoatBot.friendRequests;
                        
                        if (friendRequests.size === 0)
                                return message.reply(getLang("noRequests"));
                        
                        if (args[0]) {
                                const targetUID = args[0];
                                
                                if (!friendRequests.has(targetUID))
                                        return message.reply(getLang("notFound"));
                                
                                await api.handleFriendRequest(targetUID, true);
                                friendRequests.delete(targetUID);
                                return message.reply(getLang("acceptedOne", targetUID));
                        } else {
                                let acceptedCount = 0;
                                const requestIDs = Array.from(friendRequests.keys());
                                
                                for (const requestID of requestIDs) {
                                        try {
                                                await api.handleFriendRequest(requestID, true);
                                                friendRequests.delete(requestID);
                                                acceptedCount++;
                                        } catch (err) {
                                                console.error(`Error accepting request from ${requestID}:`, err);
                                        }
                                }
                                return message.reply(getLang("acceptedAll", acceptedCount));
                        }
                } catch (err) {
                        console.error("Error in accept command:", err);
                        return message.reply(getLang("error", err.message));
                }
        }
};