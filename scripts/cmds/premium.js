const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
        config: {
                name: "premium",
                aliases: ["prem"],
                version: "1.1",
                author: "NeoKEX",
                countDown: 5,
                role: 2,
                description: {
                        vi: "Thêm, xóa quyền premium user với thời gian",
                        en: "Add, remove premium user role with time duration"
                },
                category: "owner",
                guide: {
                        vi: '   {pn} [add | -a] <uid | @tag> [time]: Thêm quyền premium cho người dùng'
                                + '\n   Time: số ngày (1d), giờ (2h), phút (30m) hoặc permanent'
                                + '\n   Ví dụ: {pn} add @user 7d (7 ngày)'
                                + '\n   {pn} [remove | -r] <uid | @tag>: Xóa quyền premium của người dùng'
                                + '\n   {pn} [list | -l]: Liệt kê danh sách premium users'
                                + '\n   {pn} [check | -c] <uid | @tag>: Kiểm tra thời gian premium còn lại',
                        en: '   {pn} [add | -a] <uid | @tag> [time]: Add premium role for user'
                                + '\n   Time: days (1d), hours (2h), minutes (30m) or permanent'
                                + '\n   Example: {pn} add @user 7d (7 days)'
                                + '\n   {pn} [remove | -r] <uid | @tag>: Remove premium role of user'
                                + '\n   {pn} [list | -l]: List all premium users'
                                + '\n   {pn} [check | -c] <uid | @tag>: Check remaining premium time'
                }
        },

        langs: {
                vi: {
                        added: "✓ | Đã thêm quyền premium cho %1 người dùng:\n%2",
                        alreadyPremium: "\n⚠ | %1 người dùng đã có quyền premium từ trước rồi:\n%2",
                        missingIdAdd: "⚠ | Vui lòng nhập ID hoặc tag người dùng muốn thêm quyền premium",
                        removed: "✓ | Đã xóa quyền premium của %1 người dùng:\n%2",
                        notPremium: "⚠ | %1 người dùng không có quyền premium:\n%2",
                        missingIdRemove: "⚠ | Vui lòng nhập ID hoặc tag người dùng muốn xóa quyền premium",
                        listPremium: "★ | Danh sách premium users:\n%1",
                        premiumInfo: "✓ | Thông tin premium của %1:\n• Trạng thái: %2\n• Hết hạn: %3",
                        invalidTime: "⚠ | Định dạng thời gian không hợp lệ! Sử dụng: 1d (ngày), 2h (giờ), 30m (phút) hoặc permanent",
                        permanent: "Vĩnh viễn",
                        expires: "Còn %1",
                        expired: "Đã hết hạn"
                },
                en: {
                        added: "✓ | Added premium role for %1 users:\n%2",
                        alreadyPremium: "\n⚠ | %1 users already have premium role:\n%2",
                        missingIdAdd: "⚠ | Please enter ID or tag user to add premium role",
                        removed: "✓ | Removed premium role of %1 users:\n%2",
                        notPremium: "⚠ | %1 users don't have premium role:\n%2",
                        missingIdRemove: "⚠ | Please enter ID or tag user to remove premium role",
                        listPremium: "★ | List of premium users:\n%1",
                        premiumInfo: "✓ | Premium info for %1:\n• Status: %2\n• Expires: %3",
                        invalidTime: "⚠ | Invalid time format! Use: 1d (days), 2h (hours), 30m (minutes) or permanent",
                        permanent: "Permanent",
                        expires: "%1 remaining",
                        expired: "Expired"
                }
        },

        onStart: async function ({ message, args, usersData, event, getLang }) {
                if (!config.premiumUsers)
                        config.premiumUsers = [];

                const parseTime = (timeStr) => {
                        if (!timeStr || timeStr === "permanent") return null;
                        const match = timeStr.match(/^(\d+)([dhm])$/);
                        if (!match) return false;
                        const value = parseInt(match[1]);
                        const unit = match[2];
                        const multipliers = { m: 60000, h: 3600000, d: 86400000 };
                        return Date.now() + (value * multipliers[unit]);
                };

                const getTimeRemaining = (expireTime) => {
                        if (!expireTime) return getLang("permanent");
                        const remaining = expireTime - Date.now();
                        if (remaining <= 0) return getLang("expired");
                        const days = Math.floor(remaining / 86400000);
                        const hours = Math.floor((remaining % 86400000) / 3600000);
                        const minutes = Math.floor((remaining % 3600000) / 60000);
                        if (days > 0) return getLang("expires", `${days}d ${hours}h`);
                        if (hours > 0) return getLang("expires", `${hours}h ${minutes}m`);
                        return getLang("expires", `${minutes}m`);
                };

                switch (args[0]) {
                        case "add":
                        case "-a": {
                                if (args[1]) {
                                        let uids = [];
                                        let timeArg = null;
                                        
                                        if (Object.keys(event.mentions).length > 0) {
                                                uids = Object.keys(event.mentions);
                                                const lastArg = args[args.length - 1];
                                                if (!Object.keys(event.mentions).includes(lastArg) && lastArg.match(/^(\d+)([dhm])$/)) {
                                                        timeArg = lastArg;
                                                }
                                        }
                                        else if (event.messageReply) {
                                                uids.push(event.messageReply.senderID);
                                                timeArg = args[1];
                                        }
                                        else {
                                                uids = args.filter(arg => !isNaN(arg));
                                                const lastArg = args[args.length - 1];
                                                if (!uids.includes(lastArg) && lastArg.match(/^(\d+)([dhm])$/)) {
                                                        timeArg = lastArg;
                                                }
                                        }

                                        if (!timeArg || timeArg === "permanent") {
                                                timeArg = "permanent";
                                        }
                                        
                                        const expireTime = parseTime(timeArg);
                                        if (expireTime === false)
                                                return message.reply(getLang("invalidTime"));

                                        const notPremiumIds = [];
                                        const premiumIds = [];
                                        
                                        for (const uid of uids) {
                                                if (config.premiumUsers.includes(uid))
                                                        premiumIds.push(uid);
                                                else
                                                        notPremiumIds.push(uid);
                                        }

                                        config.premiumUsers.push(...notPremiumIds);
                                        
                                        for (const uid of notPremiumIds) {
                                                await usersData.set(uid, expireTime, "data.premiumExpireTime");
                                        }

                                        const getNames = await Promise.all(notPremiumIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
                                        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
                                        
                                        const timeInfo = expireTime ? getTimeRemaining(expireTime) : getLang("permanent");
                                        return message.reply(
                                                (notPremiumIds.length > 0 ? getLang("added", notPremiumIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid}) - ${timeInfo}`).join("\n")) : "")
                                                + (premiumIds.length > 0 ? getLang("alreadyPremium", premiumIds.length, premiumIds.map(uid => `• ${uid}`).join("\n")) : "")
                                        );
                                }
                                else
                                        return message.reply(getLang("missingIdAdd"));
                        }
                        case "remove":
                        case "-r": {
                                if (args[1]) {
                                        let uids = [];
                                        if (Object.keys(event.mentions).length > 0)
                                                uids = Object.keys(event.mentions);
                                        else if (event.messageReply)
                                                uids.push(event.messageReply.senderID);
                                        else
                                                uids = args.filter(arg => !isNaN(arg));
                                        
                                        const notPremiumIds = [];
                                        const premiumIds = [];
                                        
                                        for (const uid of uids) {
                                                if (config.premiumUsers.includes(uid))
                                                        premiumIds.push(uid);
                                                else
                                                        notPremiumIds.push(uid);
                                        }
                                        
                                        for (const uid of premiumIds) {
                                                config.premiumUsers.splice(config.premiumUsers.indexOf(uid), 1);
                                                await usersData.set(uid, null, "data.premiumExpireTime");
                                        }
                                        
                                        const getNames = await Promise.all(premiumIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
                                        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
                                        return message.reply(
                                                (premiumIds.length > 0 ? getLang("removed", premiumIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
                                                + (notPremiumIds.length > 0 ? getLang("notPremium", notPremiumIds.length, notPremiumIds.map(uid => `• ${uid}`).join("\n")) : "")
                                        );
                                }
                                else
                                        return message.reply(getLang("missingIdRemove"));
                        }
                        case "list":
                        case "-l": {
                                const premiumList = await Promise.all(config.premiumUsers.map(async uid => {
                                        const name = await usersData.getName(uid);
                                        const expireTime = await usersData.get(uid, "data.premiumExpireTime");
                                        const timeInfo = getTimeRemaining(expireTime);
                                        return `• ${name} (${uid}) - ${timeInfo}`;
                                }));
                                return message.reply(getLang("listPremium", premiumList.join("\n")));
                        }
                        case "check":
                        case "-c": {
                                let uid;
                                if (Object.keys(event.mentions).length > 0)
                                        uid = Object.keys(event.mentions)[0];
                                else if (event.messageReply)
                                        uid = event.messageReply.senderID;
                                else if (args[1] && !isNaN(args[1]))
                                        uid = args[1];
                                else
                                        uid = event.senderID;

                                const name = await usersData.getName(uid);
                                const isPremium = config.premiumUsers.includes(uid);
                                const expireTime = await usersData.get(uid, "data.premiumExpireTime");
                                const status = isPremium ? "Premium" : "Not Premium";
                                const timeInfo = isPremium ? getTimeRemaining(expireTime) : "N/A";
                                
                                return message.reply(getLang("premiumInfo", name, status, timeInfo));
                        }
                        default:
                                return message.SyntaxError();
                }
        }
};