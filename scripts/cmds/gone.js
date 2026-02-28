^cmd install gone.js const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
        config: {
                name: "gone",
                version: "1.0",
                author: "NeoKEX",
                countDown: 5,
                role: 0,
                longDescription: "Stream an image as response.",
                category: "image",
                guide: {
                        en: "{pn}"
                }
        },

        onStart: async function ({ message }) {
                const cacheDir = path.join(__dirname, "tmp");
                const cachePath = path.join(cacheDir, `gone_${Date.now()}.jpg`);
                
                try {
                        const imageUrl = "https://i.postimg.cc/2yyxCM3L/IMG-20251202-002135.jpg";
                        
                        await fs.ensureDir(cacheDir);
                        
                        const response = await axios.get(imageUrl, {
                                responseType: "arraybuffer",
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
                        return message.reply("Failed to stream image.");
                }
        }
};
