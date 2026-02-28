const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
        config: {
                name: "gone",
                version: "1.2",
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

        onStart: async function ({ message }) {
                const cacheDir = path.join(__dirname, "tmp");
                const cachePath = path.join(cacheDir, `gone_${Date.now()}.jpg`);
                
                try {
                        const imageUrl = "https://i.postimg.cc/2yyxCM3L/img-20251202-002135.jpg";
                        
                        await fs.ensureDir(cacheDir);
                        
                        const response = await axios.get(imageUrl, {
                                responseType: "arraybuffer",
                                headers: {
                                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                                },
                                timeout: 30000
                        });
                        
                        await fs.writeFile(cachePath, Buffer.from(response.data));
                        
                        await message.reply({
                                attachment: fs.createReadStream(cachePath)
                        });

                        if (fs.existsSync(cachePath)) {
                                await fs.remove(cachePath);
                        }
                        
                } catch (error) {
                        if (fs.existsSync(cachePath)) {
                                await fs.remove(cachePath).catch(() => {});
                        }
                        return message.reply("You're very lucky brother 🐦");
                }
        }
};
