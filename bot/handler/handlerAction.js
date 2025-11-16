const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, globalModel, usersData, threadsData, globalData) => {
        const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, globalModel, usersData, threadsData, globalData);

        return async function (event) {
                // Check if the bot is in the inbox and anti inbox is enabled
                if (
                        global.GoatBot.config.antiInbox == true &&
                        (event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
                        (event.senderID || event.userID || event.isGroup == false)
                )
                        return;

                const message = createFuncMessage(api, event);

                await handlerCheckDB(usersData, threadsData, event);
                const handlerChat = await handlerEvents(event, message);
                if (!handlerChat)
                        return;

                const {
                        onAnyEvent, onFirstChat, onStart, onChat,
                        onReply, onEvent, handlerEvent, onReaction,
                        typ, presence, read_receipt
                } = handlerChat;


                onAnyEvent();
                switch (event.type) {
                        case "message":
                        case "message_reply":
                        case "message_unsend":
                                onFirstChat();
                                onChat();
                                onStart();
                                onReply();
                                break;
                        case "event":
                                handlerEvent();
                                onEvent();
                                break;
                        case "message_reaction":
                                onReaction();
                                handlerEvent();
                                break;
                        case "typ":
                                typ();
                                break;
                        case "presence":
                                presence();
                                break;
                        case "read_receipt":
                                read_receipt();
                                break;
                        case "friend_request_received":
                                {
                                        const { userID, senderID, author } = event;
                                        const requestID = userID || senderID || author;
                                        if (requestID) {
                                                global.GoatBot.friendRequests.set(requestID, {
                                                        name: event.name || "Unknown",
                                                        timestamp: Date.now()
                                                });
                                        }
                                }
                                break;
                        case "friend_request_cancel":
                                {
                                        const { userID, senderID, author } = event;
                                        const requestID = userID || senderID || author;
                                        if (requestID) {
                                                global.GoatBot.friendRequests.delete(requestID);
                                        }
                                }
                                break;
                        default:
                                break;
                }
        };
};