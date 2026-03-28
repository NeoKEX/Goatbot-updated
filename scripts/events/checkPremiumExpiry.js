const { writeFileSync } = require("fs-extra");

let cleanupScheduled = false;

async function cleanupExpiredPremium() {
        if (cleanupScheduled) return;
        cleanupScheduled = true;
        
        setTimeout(async () => {
                const config = global.GoatBot.config;
                const expiredUsers = global.temp.expiredPremiumUsers || [];
                
                if (expiredUsers.length > 0) {
                        for (const uid of expiredUsers) {
                                const index = config.premiumUsers.indexOf(uid);
                                if (index > -1) {
                                        config.premiumUsers.splice(index, 1);
                                }
                        }
                        
                        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
                        global.temp.expiredPremiumUsers = [];
                }
                
                cleanupScheduled = false;
        }, 5000);
}

module.exports = {
        config: {
                name: "checkPremiumExpiry",
                version: "1.0",
                author: "NeoKEX",
                category: "events"
        },

        onStart: async () => {
                const expiredUsers = global.temp.expiredPremiumUsers || [];
                if (expiredUsers.length > 0) {
                        await cleanupExpiredPremium();
                }
        }
};
