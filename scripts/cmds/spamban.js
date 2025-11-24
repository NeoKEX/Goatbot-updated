const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
        config: {
                name: "spamban",
                version: "1.0",
                author: "NeoKEX",
                countDown: 5,
                role: 1,
                description: {
                        vi: "Cấm tạm thời người spam với thời gian tùy chỉnh",
                        en: "Temporarily ban spammers with customizable duration"
                },
                category: "box chat",
                guide: {
                        vi: "   {pn} [@tag|uid|reply] [time]: Cấm tạm thời người dùng"
                                + "\n   Time: số giờ (2h), phút (30m), ngày (1d), mặc định 2h"
                                + "\n   Ví dụ: {pn} @user 3h"
                                + "\n   {pn} unban [@tag|uid|reply]: Bỏ cấm người dùng"
                                + "\n   {pn} list: Xem danh sách người bị spam ban"
                                + "\n   {pn} autoban [on|off]: Bật/tắt tự động phát hiện spam"
                                + "\n   {pn} config [messages] [time]: Cấu hình phát hiện spam"
                                + "\n   Ví dụ: {pn} config 5 10s (5 tin nhắn trong 10 giây)",
                        en: "   {pn} [@tag|uid|reply] [time]: Temporarily ban user"
                                + "\n   Time: hours (2h), minutes (30m), days (1d), default 2h"
                                + "\n   Example: {pn} @user 3h"
                                + "\n   {pn} unban [@tag|uid|reply]: Unban user"
                                + "\n   {pn} list: View list of spam banned users"
                                + "\n   {pn} autoban [on|off]: Toggle automatic spam detection"
                                + "\n   {pn} config [messages] [time]: Configure spam detection"
                                + "\n   Example: {pn} config 5 10s (5 messages in 10 seconds)"
                }
        },

        langs: {
                vi: {
                        notFoundTarget: "⚠ | Vui lòng tag người cần cấm hoặc nhập uid hoặc phản hồi tin nhắn",
                        cantSelfBan: "⚠ | Bạn không thể tự cấm chính mình!",
                        cantBanAdmin: "✗ | Bạn không thể cấm quản trị viên!",
                        existedBan: "✗ | Người này đã bị spam ban!",
                        bannedSuccess: "✓ | Đã spam ban %1 trong %2!",
                        needAdmin: "⚠ | Bot cần quyền quản trị viên để kick thành viên",
                        unbannedSuccess: "✓ | Đã bỏ spam ban %1!",
                        userNotBanned: "⚠ | Người này không bị spam ban",
                        noData: "≡ | Không có ai bị spam ban",
                        listBanned: "≡ | Danh sách spam ban (trang %1/%2)",
                        content: "%1/ %2 (%3)\nLý do: Spam\nHết hạn: %4\n\n",
                        autobanEnabled: "✓ | Đã bật tự động phát hiện spam",
                        autobanDisabled: "✓ | Đã tắt tự động phát hiện spam",
                        autobanStatus: "ℹ | Tự động phát hiện spam: %1\nCấu hình: %2 tin nhắn trong %3 giây",
                        configSuccess: "✓ | Đã cấu hình: %1 tin nhắn trong %2 giây",
                        invalidConfig: "⚠ | Cấu hình không hợp lệ! Sử dụng: {pn} config [số tin nhắn] [thời gian]",
                        invalidTime: "⚠ | Thời gian không hợp lệ! Sử dụng: 1d, 2h, 30m",
                        noName: "Người dùng facebook"
                },
                en: {
                        notFoundTarget: "⚠ | Please tag user or enter uid or reply to message",
                        cantSelfBan: "⚠ | You can't ban yourself!",
                        cantBanAdmin: "✗ | You can't ban administrators!",
                        existedBan: "✗ | This user is already spam banned!",
                        bannedSuccess: "✓ | Spam banned %1 for %2!",
                        needAdmin: "⚠ | Bot needs admin permission to kick members",
                        unbannedSuccess: "✓ | Unbanned %1 from spam ban!",
                        userNotBanned: "⚠ | This user is not spam banned",
                        noData: "≡ | No spam banned users",
                        listBanned: "≡ | Spam ban list (page %1/%2)",
                        content: "%1/ %2 (%3)\nReason: Spam\nExpires: %4\n\n",
                        autobanEnabled: "✓ | Automatic spam detection enabled",
                        autobanDisabled: "✓ | Automatic spam detection disabled",
                        autobanStatus: "ℹ | Automatic spam detection: %1\nConfig: %2 messages in %3 seconds",
                        configSuccess: "✓ | Configured: %1 messages in %2 seconds",
                        invalidConfig: "⚠ | Invalid config! Use: {pn} config [message count] [time]",
                        invalidTime: "⚠ | Invalid time! Use: 1d, 2h, 30m",
                        noName: "Facebook user"
                }
        },

        onStart: async function ({ message, event, args, threadsData, getLang, usersData, api }) {
                const { members, adminIDs } = await threadsData.get(event.threadID);
                const { senderID } = event;

                const parseTime = (timeStr) => {
                        if (!timeStr) return 7200000; // 2h default
                        const match = timeStr.match(/^(\d+)([dhms])$/);
                        if (!match) return false;
                        const value = parseInt(match[1]);
                        const unit = match[2];
                        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
                        return value * multipliers[unit];
                };

                const formatDuration = (ms) => {
                        const days = Math.floor(ms / 86400000);
                        const hours = Math.floor((ms % 86400000) / 3600000);
                        const minutes = Math.floor((ms % 3600000) / 60000);
                        if (days > 0) return `${days}d ${hours}h`;
                        if (hours > 0) return `${hours}h ${minutes}m`;
                        return `${minutes}m`;
                };

                const spamBans = await threadsData.get(event.threadID, 'data.spamban', []);

                // Autoban toggle
                if (args[0] === 'autoban') {
                        const currentStatus = await threadsData.get(event.threadID, 'data.spamban_auto', false);
                        if (args[1] === 'on') {
                                await threadsData.set(event.threadID, true, 'data.spamban_auto');
                                return message.reply(getLang('autobanEnabled'));
                        }
                        else if (args[1] === 'off') {
                                await threadsData.set(event.threadID, false, 'data.spamban_auto');
                                return message.reply(getLang('autobanDisabled'));
                        }
                        else {
                                const config = await threadsData.get(event.threadID, 'data.spamban_config', { messages: 5, time: 10 });
                                return message.reply(getLang('autobanStatus', currentStatus ? 'ON' : 'OFF', config.messages, config.time));
                        }
                }

                // Config spam detection
                if (args[0] === 'config') {
                        const msgCount = parseInt(args[1]);
                        const timeMatch = args[2]?.match(/^(\d+)s$/);
                        if (!msgCount || !timeMatch) {
                                return message.reply(getLang('invalidConfig'));
                        }
                        const timeSeconds = parseInt(timeMatch[1]);
                        await threadsData.set(event.threadID, { messages: msgCount, time: timeSeconds }, 'data.spamban_config');
                        return message.reply(getLang('configSuccess', msgCount, timeSeconds));
                }

                // Unban
                if (args[0] === 'unban') {
                        let target;
                        if (!isNaN(args[1]))
                                target = args[1];
                        else if (Object.keys(event.mentions || {}).length)
                                target = Object.keys(event.mentions)[0];
                        else if (event.messageReply?.senderID)
                                target = event.messageReply.senderID;
                        else
                                return message.reply(getLang('notFoundTarget'));

                        const index = spamBans.findIndex(item => item.id == target);
                        if (index === -1)
                                return message.reply(getLang('userNotBanned'));

                        spamBans.splice(index, 1);
                        await threadsData.set(event.threadID, spamBans, 'data.spamban');
                        const userName = members[target]?.name || await usersData.getName(target) || getLang('noName');
                        return message.reply(getLang('unbannedSuccess', userName));
                }

                // List
                if (args[0] === 'list') {
                        if (!spamBans.length)
                                return message.reply(getLang('noData'));

                        const limit = 20;
                        const page = parseInt(args[1]) || 1;
                        const start = (page - 1) * limit;
                        const end = page * limit;
                        const data = spamBans.slice(start, end);
                        let msg = '';
                        let count = 0;

                        for (const user of data) {
                                count++;
                                const name = members[user.id]?.name || await usersData.getName(user.id) || getLang('noName');
                                const expiryTime = moment(user.expireTime).tz(global.GoatBot.config.timeZone).format('HH:mm:ss DD/MM/YYYY');
                                msg += getLang('content', start + count, name, user.id, expiryTime);
                        }
                        return message.reply(getLang('listBanned', page, Math.ceil(spamBans.length / limit)) + '\n\n' + msg);
                }

                // Ban user
                let target;
                let timeArg = args[args.length - 1];

                if (event.messageReply?.senderID) {
                        target = event.messageReply.senderID;
                }
                else if (Object.keys(event.mentions || {}).length) {
                        target = Object.keys(event.mentions)[0];
                }
                else if (!isNaN(args[0])) {
                        target = args[0];
                }
                else {
                        return message.reply(getLang('notFoundTarget'));
                }

                if (target == senderID)
                        return message.reply(getLang('cantSelfBan'));
                if (adminIDs.includes(target))
                        return message.reply(getLang('cantBanAdmin'));

                const banned = spamBans.find(item => item.id == target);
                if (banned)
                        return message.reply(getLang('existedBan'));

                const duration = parseTime(timeArg);
                if (duration === false)
                        return message.reply(getLang('invalidTime'));

                const name = members[target]?.name || await usersData.getName(target) || getLang('noName');
                const expireTime = Date.now() + duration;

                const data = {
                        id: target,
                        expireTime,
                        bannedBy: senderID,
                        bannedAt: Date.now()
                };

                spamBans.push(data);
                await threadsData.set(event.threadID, spamBans, 'data.spamban');

                message.reply(getLang('bannedSuccess', name, formatDuration(duration)), () => {
                        if (members.some(item => item.userID == target)) {
                                if (adminIDs.includes(api.getCurrentUserID())) {
                                        if (event.participantIDs.includes(target))
                                                api.removeUserFromGroup(target, event.threadID);
                                }
                                else {
                                        message.send(getLang('needAdmin'));
                                }
                        }
                });
        }
};
