const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
const { getStreamFromURL, shortenURL, randomString } = global.utils;

async function billboardText(api, event, args, message) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);

    try {
        // Get text from arguments
        const text = args.join(" ");
        
        if (!text) {
            message.reply("Please provide text for the billboard.\nExample: {p}billboard Hello World");
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return;
        }

        // Encode the text for URL
        const encodedText = encodeURIComponent(text);
        
        // Billboard API endpoint
        const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/billboard?text=${encodedText}`;
        
        // Shorten the URL
        const shortenedUrl = await shortenURL(apiUrl);

        // Download the image to cache
        const imageId = randomString(10);
        const imagePath = path.join(__dirname, "cache", `${imageId}.png`);

        const writer = fs.createWriteStream(imagePath);
        const response = await axios({
            url: apiUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        writer.on('finish', () => {
            const imageStream = fs.createReadStream(imagePath);
            message.reply({ 
                body: `📋 Billboard Created Successfully!\n📝 Text: ${text}\n🔗 Link: ${shortenedUrl}`, 
                attachment: imageStream 
            });
            api.setMessageReaction("✅", event.messageID, () => {}, true);

            // Clean up cache file after sending
            setTimeout(() => {
                fs.unlink(imagePath, (err) => {
                    if (err) console.error("Error deleting cache file:", err);
                });
            }, 5000);
        });

        writer.on('error', (error) => {
            console.error("Download error:", error);
            message.reply("Error downloading the billboard image. Here's the link instead:\n" + shortenedUrl);
            api.setMessageReaction("✅", event.messageID, () => {}, true);
        });

    } catch (error) {
        console.error("Error creating billboard:", error);
        message.reply("Failed to create billboard. Please try again later.");
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

module.exports = {
    config: {
        name: "billboard",
        version: "1.0",
        author: "Ry",
        countDown: 5,
        role: 0,
        shortDescription: "Create billboard with text",
        longDescription: "Create a billboard image with custom text using the billboard API",
        category: "image",
        guide: {
            en: "{p}billboard <text>"
        }
    },
    onStart: function ({ api, event, args, message }) {
        return billboardText(api, event, args, message);
    }
};
