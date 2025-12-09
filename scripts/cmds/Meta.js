const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const API_ENDPOINT = "https://metakexbyneokex.fly.dev/images/generate";

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
        version: "1.0",
        author: "Neoaz ゐ",
        countDown: 20,
        role: 0,
        longDescription: "Generate images using Meta.AI. Returns a grid of 4 images, reply with 1-4 to select one or 'all' for all images.",
        category: "ai-image",
        guide: {
            en: "{pn} <prompt>\n\nExample: {pn} a cute cat playing with yarn\n\nAfter receiving the grid, reply with 1, 2, 3, 4 to select one image, or 'all' to get all images."
        }
    },

    onStart: async function({ message, args, event, commandName }) {
        const prompt = args.join(" ");
        const cacheDir = path.join(__dirname, 'cache');

        if (!fs.existsSync(cacheDir)) {
            await fs.mkdirp(cacheDir);
        }

        if (!prompt) {
            return message.reply("❌ Please provide a prompt to generate images.\n\nExample: meta a beautiful sunset over mountains");
        }

        message.reaction("⏳", event.messageID);

        const tempPaths = [];
        let gridPath = '';

        try {
            const response = await axios.post(API_ENDPOINT, {
                prompt: prompt.trim()
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 150000
            });

            const data = response.data;

            if (!data.success || !data.images || data.images.length === 0) {
                const errorMsg = data.message || "API did not return any images.";
                throw new Error(errorMsg);
            }

            const imageUrls = data.images.slice(0, 4).map(img => img.url);

            if (imageUrls.length < 4) {
                throw new Error(`Expected 4 images but received ${imageUrls.length}.`);
            }

            for (let i = 0; i < imageUrls.length; i++) {
                const imgPath = await downloadImage(
                    imageUrls[i],
                    cacheDir,
                    `meta_${Date.now()}_${i + 1}.png`
                );
                tempPaths.push(imgPath);
            }

            gridPath = path.join(cacheDir, `meta_grid_${Date.now()}.png`);
            await createGridImage(tempPaths, gridPath);

            message.reply({
                body: `✨ Meta AI generated 4 images\n\n📷 Reply with 1, 2, 3, 4 to select one image, or "all" to get all images.`,
                attachment: fs.createReadStream(gridPath)
            }, (err, info) => {
                if (!err) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName,
                        messageID: info.messageID,
                        author: event.senderID,
                        imageUrls: imageUrls,
                        tempPaths: tempPaths,
                        gridPath: gridPath,
                        prompt: prompt
                    });
                } else {
                    for (const p of tempPaths) {
                        if (fs.existsSync(p)) fs.unlinkSync(p);
                    }
                    if (gridPath && fs.existsSync(gridPath)) fs.unlinkSync(gridPath);
                }
            });

            message.reaction("✅", event.messageID);

        } catch (error) {
            message.reaction("❌", event.messageID);

            for (const p of tempPaths) {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            }
            if (gridPath && fs.existsSync(gridPath)) fs.unlinkSync(gridPath);

            let errorMessage = "An error occurred during image generation.";
            if (error.response) {
                if (error.response.status === 422) {
                    errorMessage = "Invalid prompt format. Please try a different prompt.";
                } else if (error.response.status === 503) {
                    errorMessage = "Service temporarily unavailable. Please try again later.";
                } else if (error.response.status === 500) {
                    errorMessage = error.response.data?.detail || "Server error occurred.";
                } else {
                    errorMessage = `HTTP Error: ${error.response.status}`;
                }
            } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                errorMessage = "Request timed out. The image generation is taking too long, please try again.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            console.error("Meta Command Error:", error);
            message.reply(`❌ ${errorMessage}`);
        }
    },

    onReply: async function({ message, event, Reply }) {
        const { imageUrls, tempPaths, gridPath, prompt, author } = Reply;

        if (event.senderID !== author) {
            return;
        }

        const userReply = event.body.trim().toLowerCase();
        const cacheDir = path.join(__dirname, 'cache');
        const selectedImagePaths = [];

        try {
            message.reaction("⏳", event.messageID);

            if (userReply === 'all') {
                for (let i = 0; i < imageUrls.length; i++) {
                    const imgPath = path.join(cacheDir, `meta_selected_all_${Date.now()}_${i + 1}.png`);
                    await downloadImage(imageUrls[i], cacheDir, path.basename(imgPath));
                    selectedImagePaths.push(imgPath);
                }

                await message.reply({
                    body: `✨ Here are all your images`,
                    attachment: selectedImagePaths.map(p => fs.createReadStream(p))
                });
            } else {
                const selection = parseInt(userReply);

                if (isNaN(selection) || selection < 1 || selection > 4) {
                    message.reaction("", event.messageID);
                    return;
                }

                const selectedUrl = imageUrls[selection - 1];

                if (!selectedUrl) {
                    return message.reply("❌ Invalid selection. Please reply with 1, 2, 3, 4, or 'all'.");
                }

                const selectedImagePath = path.join(cacheDir, `meta_selected_${Date.now()}.png`);
                await downloadImage(selectedUrl, cacheDir, path.basename(selectedImagePath));
                selectedImagePaths.push(selectedImagePath);

                await message.reply({
                    body: `✨ Here is your image`,
                    attachment: fs.createReadStream(selectedImagePath)
                });
            }

            message.reaction("✅", event.messageID);

        } catch (error) {
            message.reaction("❌", event.messageID);
            console.error("Meta Selection Error:", error);
            message.reply(`❌ Failed to retrieve selected image: ${error.message}`);
        } finally {
            const cleanup = async () => {
                for (const p of selectedImagePaths) {
                    if (p && fs.existsSync(p)) {
                        await fs.unlink(p).catch(console.error);
                    }
                }
                if (tempPaths) {
                    await Promise.all(tempPaths.map(p =>
                        fs.existsSync(p) ? fs.unlink(p).catch(console.error) : Promise.resolve()
                    ));
                }
                if (gridPath && fs.existsSync(gridPath)) {
                    await fs.unlink(gridPath).catch(console.error);
                }
            };
            cleanup().catch(console.error);

            global.GoatBot.onReply.delete(Reply.messageID);
        }
    }
};
