const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const API_ENDPOINT = "https://metabyneokex.vercel.app/photos/generate";

async function downloadImage(url, tempDir, filename) {
    const tempFilePath = path.join(tempDir, filename);
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
            timeout: 60000
        });
        await fs.writeFile(tempFilePath, response.data);
        return tempFilePath;
    } catch (e) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error(`Failed to download image: ${e.message}`);
    }
}

async function createGridImage(imagePaths, outputPath) {
    const images = await Promise.all(imagePaths.map(p => loadImage(p)));
    const imgWidth = images[0].width;
    const imgHeight = images[0].height;
    const padding = 10;
    const numberSize = 40;

    const canvasWidth = (imgWidth * 2) + (padding * 3);
    const canvasHeight = (imgHeight * 2) + (padding * 3);

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const positions = [
        { x: padding, y: padding },
        { x: imgWidth + (padding * 2), y: padding },
        { x: padding, y: imgHeight + (padding * 2) },
        { x: imgWidth + (padding * 2), y: imgHeight + (padding * 2) }
    ];

    for (let i = 0; i < images.length && i < 4; i++) {
        const { x, y } = positions[i];
        ctx.drawImage(images[i], x, y, imgWidth, imgHeight);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(x + numberSize, y + numberSize, numberSize - 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((i + 1).toString(), x + numberSize, y + numberSize);
    }

    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}

module.exports = {
    config: {
        name: "meta",
        aliases: ["metaai", "metagen"],
        version: "2.5",
        author: "Neoaz ゐ",
        countDown: 20,
        role: 0,
        longDescription: "Generate 4 images using Meta AI with persistence on selection.",
        category: "ai-image",
        guide: {
            en: "{pn} <prompt> --ar <ratio>\nExample: {pn} a cybernetic forest --ar 16:9"
        }
    },

    onStart: async function({ message, args, event, commandName }) {
        let fullPrompt = args.join(" ");
        if (!fullPrompt) return message.reply("Please provide a prompt.");

        let orientation = "SQUARE";
        if (fullPrompt.includes("--ar 16:9")) {
            orientation = "LANDSCAPE";
            fullPrompt = fullPrompt.replace("--ar 16:9", "");
        } else if (fullPrompt.includes("--ar 9:16")) {
            orientation = "VERTICAL";
            fullPrompt = fullPrompt.replace("--ar 9:16", "");
        }

        const prompt = fullPrompt.trim();
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) await fs.mkdirp(cacheDir);

        message.reaction("⏳", event.messageID);

        try {
            const response = await axios.get(API_ENDPOINT, {
                params: { prompt, orientation },
                timeout: 180000
            });

            const data = response.data;
            if (!data.success || !data.image_urls) throw new Error("Generation failed.");

            const imageUrls = data.image_urls.slice(0, 4);
            const tempPaths = [];

            for (let i = 0; i < imageUrls.length; i++) {
                const imgPath = await downloadImage(imageUrls[i], cacheDir, `meta_${Date.now()}_${i + 1}.png`);
                tempPaths.push(imgPath);
            }

            const gridPath = path.join(cacheDir, `meta_grid_${Date.now()}.png`);
            await createGridImage(tempPaths, gridPath);

            message.reply({
                body: `✨ Prompt: ${prompt}\n📐 Ratio: ${orientation}\n\n📷 Reply with 1-4 to select, or "all" to get all.`,
                attachment: fs.createReadStream(gridPath)
            }, (err, info) => {
                if (!err) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName,
                        messageID: info.messageID,
                        author: event.senderID,
                        imageUrls,
                        tempPaths,
                        gridPath
                    });
                }
            });

            message.reaction("✅", event.messageID);
        } catch (error) {
            message.reaction("❌", event.messageID);
            message.reply("Error: " + error.message);
        }
    },

    onReply: async function({ message, event, Reply }) {
        if (event.senderID !== Reply.author) return;

        const userReply = event.body.trim().toLowerCase();
        const cacheDir = path.join(__dirname, 'cache');
        const selectedPaths = [];

        try {
            message.reaction("⏳", event.messageID);

            if (userReply === 'all') {
                for (let i = 0; i < Reply.imageUrls.length; i++) {
                    const imgPath = await downloadImage(Reply.imageUrls[i], cacheDir, `meta_all_${Date.now()}_${i}.png`);
                    selectedPaths.push(imgPath);
                }
                await message.reply({ body: "All images:", attachment: selectedPaths.map(p => fs.createReadStream(p)) });
            } else {
                const i = parseInt(userReply) - 1;
                if (i >= 0 && i < Reply.imageUrls.length) {
                    const imgPath = await downloadImage(Reply.imageUrls[i], cacheDir, `meta_one_${Date.now()}.png`);
                    selectedPaths.push(imgPath);
                    await message.reply({ body: `Image ${i + 1}:`, attachment: fs.createReadStream(imgPath) });
                } else {
                    return message.reaction("❓", event.messageID);
                }
            }
            message.reaction("✅", event.messageID);
        } catch (e) {
            message.reply("Error: " + e.message);
        } finally {
            setTimeout(async () => {
                for (const p of selectedPaths) {
                    if (fs.existsSync(p)) await fs.unlink(p);
                }
                if (Reply.tempPaths) {
                    for (const p of Reply.tempPaths) {
                        if (fs.existsSync(p)) await fs.unlink(p);
                    }
                }
                if (Reply.gridPath && fs.existsSync(Reply.gridPath)) await fs.unlink(Reply.gridPath);
            }, 5000);
        }
    }
};
