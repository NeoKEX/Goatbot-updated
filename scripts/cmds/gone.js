const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
        config: {
                name: "gone",
                version: "1.1",
                author: "Neoaz ゐ | Fahim",
                countDown: 5,
                role: 4,
                description: {
                        en: "Run if you want to vanish your bot id 🐦"
                },
                category: "XudlingPong ⚠️",
                guide: {
                        en: "{pn} gone"
                }
        },

        langs: {
                en: {
                        error: "You're very lucky brother 🐦"
                }
        },

        onStart: async function ({ message, getLang }) {
                const cachePath = path.join(__dirname, "tmp", `gone_${Date.now()}.jpg`);
                
                try {
                        const imageUrl = "https://i.postimg.cc/2yyxCM3L/img-20251202-002135.jpg";
                        
                        await fs.ensureDir(path.dirname(cachePath));
                        
                        const response = await axios.get(imageUrl, {
                                responseType: "arraybuffer",
                                headers: {
                                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                                },
                                timeout: 30000
                        });
                        
                        await fs.writeFile(cachePath, Buffer.from(response.data));
                        
                        return message.reply({
                                attachment: fs.createReadStream(cachePath)
                        }, () => fs.remove(cachePath).catch(() => {}));
                        
                } catch (error) {
                        console.error("Gone command error:", error.message);
                        if (fs.existsSync(cachePath)) {
                                await fs.remove(cachePath).catch(() => {});
                        }
                        return message.reply(getLang("error"));
                }
        }
};
