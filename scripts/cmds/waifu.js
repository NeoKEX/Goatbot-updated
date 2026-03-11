const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');

async function getWaifuImage() {
    try {
        const response = await axios.get("https://api.waifu.pics/sfw/neko");
        const { url } = response.data;
        
        // Download the image
        const imageResponse = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream'
        });
        
        return imageResponse.data;
    } catch (error) {
        console.error("Error fetching waifu image:", error);
        throw error;
    }
}

module.exports = {
    config: {
        name: "waifu",
        version: "1.0.0",
        author: ["lianecagara", "api.waifu.pics"],
        countDown: 5,
        role: 0,
        shortDescription: "Get random waifu/neko images",
        longDescription: "Get random neko waifu pictures from the waifu.pics API",
        category: "image",
        guide: {
            en: "{pn}"
        }
    },
    onStart: async function({ message, event, api }) {
        try {
            message.reaction("⏳", event.messageID);

            const stream = await getWaifuImage();
            
            // Save to cache
            const imageId = Date.now();
            const imagePath = path.join(__dirname, "cache", `waifu_${imageId}.png`);
            
            const writer = fs.createWriteStream(imagePath);
            stream.pipe(writer);

            writer.on('finish', () => {
                message.reply({
                    body: "💝 Here's your waifu! 💝\nCategory: Neko",
                    attachment: fs.createReadStream(imagePath)
                });
                message.reaction("✅", event.messageID);
                
                // Clean up after 10 seconds
                setTimeout(() => {
                    fs.unlink(imagePath, (err) => {
                        if (err) console.error("Error deleting cache file:", err);
                    });
                }, 10000);
            });

            writer.on('error', (error) => {
                console.error("Download error:", error);
                message.reply("Failed to download waifu image. Please try again.");
                message.reaction("❌", event.messageID);
            });

        } catch (error) {
            console.error("Error in waifu command:", error);
            message.reply("Failed to get waifu image. Please try again later.");
            message.reaction("❌", event.messageID);
        }
    }
};
