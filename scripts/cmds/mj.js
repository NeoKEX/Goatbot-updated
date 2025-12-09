const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');
const { createCanvas, loadImage } = require('canvas');

const pipeline = promisify(stream.pipeline);
const API_ENDPOINT = "https://dev.oculux.xyz/api/mj-proxy-pub"; 

async function downloadSingleImage(url, tempDir, index) {
    let tempFilePath = '';
    try {
        const imageStreamResponse = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
            timeout: 120000 
        });

        tempFilePath = path.join(tempDir, `mj_single_${Date.now()}_${index}.jpg`);
        await fs.writeFile(tempFilePath, imageStreamResponse.data);

        return { path: tempFilePath };

    } catch (e) {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error("Failed to download the image.");
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
    name: "midjourney",
    aliases: ["mj", "imagine"],
    version: "20.0",
    author: "NeoKEX",
    countDown: 20,
    role: 0,
    longDescription: "Generate 4 Midjourney images in a grid and select one or all by replying.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt>\n\nExample: {pn} a futuristic city at sunset\n\nAfter receiving the grid, reply with 1, 2, 3, 4 to select one image, or 'all' to get all images."
    }
  },

  onStart: async function({ message, args, event, commandName }) {
    let prompt = args.join(" ");
    const cacheDir = path.join(__dirname, 'cache');

    if (!fs.existsSync(cacheDir)) await fs.mkdirp(cacheDir);

    if (!prompt) {
      return message.reply("❌ Please provide a prompt to generate an image.");
    }

    message.reaction("⏳", event.messageID);

    const tempPaths = [];
    let gridPath = '';
    
    try {
      const cleanedPrompt = prompt.trim();
      
      const apiResponse = await axios.get(`${API_ENDPOINT}?prompt=${encodeURIComponent(cleanedPrompt)}&usepolling=false`, { timeout: 300000 }); 
      const data = apiResponse.data;

      if (!data.status || data.status === "failed" || !data.results || data.results.length < 4) {
        const errorDetail = data.message || "API did not return a successful status or enough images (expected 4).";
        throw new Error(`Generation failed: ${errorDetail}`);
      }
      
      const finalUrls = data.results.slice(0, 4); 

      for (let i = 0; i < finalUrls.length; i++) {
          const result = await downloadSingleImage(finalUrls[i], cacheDir, i + 1);
          tempPaths.push(result.path);
      }

      gridPath = path.join(cacheDir, `mj_grid_${Date.now()}.png`);
      await createGridImage(tempPaths, gridPath);
      
      message.reply({
        body: `✨ Midjourney generated 4 images\n\n📷 Reply with 1, 2, 3, 4 to select one image, or "all" to get all images.`,
        attachment: fs.createReadStream(gridPath)
      }, (err, info) => {
        if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
                commandName,
                messageID: info.messageID,
                author: event.senderID,
                imageUrls: finalUrls,
                tempPaths: tempPaths,
                gridPath: gridPath,
                prompt: cleanedPrompt
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

      const errorMessage = error.response ? error.response.data.error || error.response.data.message || `HTTP Error: ${error.response.status}` : error.message;
      console.error("Midjourney Command Error:", error);
      message.reply(`❌ Image generation failed: ${errorMessage}`);
    }
  },

  onReply: async function({ message, event, Reply }) { 
    const { imageUrls, tempPaths, gridPath, author } = Reply;
    const cacheDir = path.join(__dirname, 'cache');

    if (event.senderID !== author) {
        return;
    }
    
    const userReply = event.body.trim().toLowerCase();
    const selectedImagePaths = [];
    
    try {
        message.reaction("⏳", event.messageID);

        if (userReply === 'all') {
            for (let i = 0; i < imageUrls.length; i++) {
                const result = await downloadSingleImage(imageUrls[i], cacheDir, `final_all_${i + 1}`);
                selectedImagePaths.push(result.path);
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

            const result = await downloadSingleImage(selectedUrl, cacheDir, `final_${selection}`);
            selectedImagePaths.push(result.path);
            
            await message.reply({
                body: `✨ Here is your image`,
                attachment: fs.createReadStream(selectedImagePaths[0])
            });
        }

        message.reaction("✅", event.messageID);

    } catch (error) {
        message.reaction("❌", event.messageID);
        console.error("Selection Download Error:", error);
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