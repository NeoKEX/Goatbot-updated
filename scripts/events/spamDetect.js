const moment = require("moment-timezone");

module.exports = {
        config: {
                name: "spamDetect",
                version: "1.0",
                author: "NeoKEX",
                category: "events"
        },

        onStart: async ({ threadsData, usersData, event, api, message }) => {
                const { threadID, senderID, isGroup } = event;
                
                if (!isGroup || !senderID)
                        return;

                const threadData = await threadsData.get(threadID);
                const { adminIDs } = threadData;

                // Skip if user is admin
                if (adminIDs.includes(senderID))
                        return;

                // Check and remove expired spam bans
                const spamBans = await threadsData.get(threadID, 'data.spamban', []);
                const now = Date.now();
                let hasExpired = false;

                for (let i = spamBans.length - 1; i >= 0; i--) {
                        if (spamBans[i].expireTime <= now) {
                                spamBans.splice(i, 1);
                                hasExpired = true;
                        }
                }

                if (hasExpired) {
                        await threadsData.set(threadID, spamBans, 'data.spamban');
                }

                // Check if user is currently spam banned
                const isBanned = spamBans.find(item => item.id == senderID);
                if (isBanned) {
                        if (adminIDs.includes(api.getCurrentUserID())) {
                                api.removeUserFromGroup(senderID, threadID);
                        }
                        return;
                }

                // Auto spam detection
                const autobanEnabled = await threadsData.get(threadID, 'data.spamban_auto', false);
                if (!autobanEnabled)
                        return;

                const config = await threadsData.get(threadID, 'data.spamban_config', { messages: 5, time: 10 });
                
                // Initialize spam tracking
                if (!global.temp.spamTracking)
                        global.temp.spamTracking = {};
                
                const trackKey = `${threadID}_${senderID}`;
                if (!global.temp.spamTracking[trackKey])
                        global.temp.spamTracking[trackKey] = [];

                const userMessages = global.temp.spamTracking[trackKey];
                const currentTime = Date.now();
                
                // Add current message
                userMessages.push(currentTime);
                
                // Remove messages older than detection window
                const timeWindow = config.time * 1000;
                global.temp.spamTracking[trackKey] = userMessages.filter(time => currentTime - time < timeWindow);
                
                // Check if spam threshold exceeded
                if (global.temp.spamTracking[trackKey].length >= config.messages) {
                        // Auto-ban for 2 hours (default)
                        const duration = 7200000; // 2h
                        const expireTime = Date.now() + duration;
                        
                        const banData = {
                                id: senderID,
                                expireTime,
                                bannedBy: 'AUTO',
                                bannedAt: Date.now()
                        };
                        
                        spamBans.push(banData);
                        await threadsData.set(threadID, spamBans, 'data.spamban');
                        
                        const userName = await usersData.getName(senderID);
                        message.send(`⚠ | ${userName} has been automatically banned for spam (2 hours)`);
                        
                        // Clear tracking for this user
                        delete global.temp.spamTracking[trackKey];
                        
                        // Kick if bot has admin
                        if (adminIDs.includes(api.getCurrentUserID())) {
                                api.removeUserFromGroup(senderID, threadID);
                        }
                }
        }
};
