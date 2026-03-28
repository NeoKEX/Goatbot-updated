const moment = require("moment-timezone");

module.exports = {
        config: {
                name: "spamban",
                aliases: ["unspam", "spamlist"],
                version: "2.0",
                author: "NeoKEX",
                countDown: 5,
                role: 2,
                description: {
                        vi: "Quản lý danh sách các nhóm bị spam ban tự động",
                        en: "Manage auto spam-banned threads (unban only)"
                },
                category: "owner",
                guide: {
                        vi: "   {pn} list: Xem danh sách nhóm bị spam ban"
                                + "\n   {pn} unban <threadID>: Bỏ spam ban nhóm"
                                + "\n   {pn} info: Xem cấu hình spam detection",
                        en: "   {pn} list: View list of spam-banned threads"
                                + "\n   {pn} unban <threadID>: Unban a spam-banned thread"
                                + "\n   {pn} info: View spam detection config"
                }
        },

        langs: {
                vi: {
                        noData: "≡ | Không có nhóm nào bị spam ban",
                        listBanned: "≡ | Danh sách spam ban (trang %1/%2):\n\n%3",
                        unbanned: "✅ | Đã bỏ spam ban cho nhóm %1",
                        notBanned: "⚠ | Nhóm này không bị spam ban",
                        invalidThreadID: "⚠ | Vui lòng nhập threadID hợp lệ",
                        info: "📊 | Spam Detection Config:\n• Threshold: %1 commands in %2 seconds\n• Ban duration: %3 hours\n• Total banned threads: %4"
                },
                en: {
                        noData: "≡ | No spam-banned threads",
                        listBanned: "≡ | Spam banned threads (page %1/%2):\n\n%3",
                        unbanned: "✅ | Unbanned thread %1 from spam ban",
                        notBanned: "⚠ | This thread is not spam-banned",
                        invalidThreadID: "⚠ | Please enter a valid threadID",
                        info: "📊 | Spam Detection Config:\n• Threshold: %1 commands in %2 seconds\n• Ban duration: %3 hours\n• Total banned threads: %4"
                }
        },

        onStart: async function ({ message, args, threadsData, globalData, getLang }) {
                const spamConfig = global.GoatBot.config.spamProtection || {
                        commandThreshold: 8,
                        timeWindow: 10,
                        banDuration: 24
                };

                const spamBannedThreads = await globalData.get("spamBannedThreads", "data", {});

                const now = Date.now();
                let hasExpired = false;
                for (const threadID in spamBannedThreads) {
                        if (spamBannedThreads[threadID].expireTime <= now) {
                                delete spamBannedThreads[threadID];
                                hasExpired = true;
                        }
                }
                if (hasExpired) {
                        await globalData.set("spamBannedThreads", spamBannedThreads, "data");
                }

                switch (args[0]) {
                        case "list":
                        case "-l": {
                                const threadIDs = Object.keys(spamBannedThreads);
                                if (threadIDs.length === 0) {
                                        return message.reply(getLang("noData"));
                                }

                                const limit = 10;
                                const page = parseInt(args[1]) || 1;
                                const start = (page - 1) * limit;
                                const end = page * limit;
                                const data = threadIDs.slice(start, end);
                                
                                let msg = "";
                                for (let i = 0; i < data.length; i++) {
                                        const threadID = data[i];
                                        const banInfo = spamBannedThreads[threadID];
                                        const expireTime = moment(banInfo.expireTime)
                                                .tz(global.GoatBot.config.timeZone || "Asia/Ho_Chi_Minh")
                                                .format("HH:mm:ss DD/MM/YYYY");
                                        const threadName = banInfo.threadName || "Unknown";
                                        msg += `${start + i + 1}. ${threadName}\n   ID: ${threadID}\n   Expires: ${expireTime}\n\n`;
                                }

                                return message.reply(getLang("listBanned", page, Math.ceil(threadIDs.length / limit), msg));
                        }

                        case "unban":
                        case "-u": {
                                const threadID = args[1];
                                if (!threadID || isNaN(threadID)) {
                                        return message.reply(getLang("invalidThreadID"));
                                }

                                if (!spamBannedThreads[threadID]) {
                                        return message.reply(getLang("notBanned"));
                                }

                                const threadName = spamBannedThreads[threadID].threadName || threadID;
                                delete spamBannedThreads[threadID];
                                await globalData.set("spamBannedThreads", spamBannedThreads, "data");

                                return message.reply(getLang("unbanned", threadName));
                        }

                        case "info":
                        case "-i": {
                                const threadCount = Object.keys(spamBannedThreads).length;
                                return message.reply(getLang("info", 
                                        spamConfig.commandThreshold,
                                        spamConfig.timeWindow,
                                        spamConfig.banDuration,
                                        threadCount
                                ));
                        }

                        default: {
                                return message.reply(
                                        "📋 | Spam Ban Management\n\n" +
                                        "Usage:\n" +
                                        "• list - View banned threads\n" +
                                        "• unban <threadID> - Unban a thread\n" +
                                        "• info - View spam detection config\n\n" +
                                        "Note: Threads are auto-banned when users spam commands too quickly."
                                );
                        }
                }
        }
};
