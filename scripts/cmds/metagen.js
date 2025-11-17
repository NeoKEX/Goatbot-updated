const axios = require('axios');
const fs = require('fs');
const path = require('path');
// REQUIRES: npm install jimp
const Jimp = require('jimp'); 

const API_BASE_URL = "https://metakexbyneokex.fly.dev";
const API_ENDPOINT = `${API_BASE_URL}/v1/images/generate`;
const GRID_SIZE = 2; 

// --- Helper Functions ---

// Helper to create a 2x2 grid from 4 image URLs
async function createGrid(imageUrls, tempDir) {
    const images = [];

    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const { data } = await axios.get(url, { responseType: 'arraybuffer' });
        images.push(await Jimp.read(Buffer.from(data)));
    }

    const [img1, img2, img3, img4] = images;

    const targetWidth = Math.min(img1.bitmap.width, img2.bitmap.width, img3.bitmap.width, img4.bitmap.width);
    const targetHeight = Math.min(img1.bitmap.height, img2.bitmap.height, img3.bitmap.height, img4.bitmap.height);

    images.forEach(img => img.resize(targetWidth, targetHeight));

    const gridWidth = targetWidth * GRID_SIZE;
    const gridHeight = targetHeight * GRID_SIZE;

    const grid = new Jimp(gridWidth, gridHeight, 0xFFFFFFFF); 

    grid.composite(images[0], 0, 0); 
    grid.composite(images[1], targetWidth, 0); 
    grid.composite(images[2], 0, targetHeight); 
    grid.composite(images[3], targetWidth, targetHeight); 

    const gridPath = path.join(tempDir, `grid_${Date.now()}.png`);
    await grid.writeAsync(gridPath);
    return gridPath;
}

// Helper to download and save a single image stream to a file
async function downloadAndSaveFile(url, tempDir) {
    let tempFilePath = path.join(tempDir, `single_${Date.now()}.jpg`);
    
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempFilePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        return tempFilePath;

    } catch (e) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error("Failed to download the selected image.");
    }
}

module.exports = {
  config: {
    name: "metagen",
    aliases: ["metaai", "mimg"],
    version: "2.1",
    author: "NeoKEX",//don't change author name otherwise ill fuck your momys ass-_-
    countDown: 20, 
    role: 0,
    longDescription: "Generate 4 images using Meta AI, displays them in a grid, and allows selection.",
    category: "ai-image",
    guide: {
      en: "{pn} [prompt] | [orientation: VERTICAL/HORIZONTAL]. Reply 1-4 to select image."
    }
  },

  onStart: async function({ args, message, event, commandName }) {
    let prompt = args.join(" ");
    let orientation = "VERTICAL"; 
    const cacheDir = path.join(__dirname, 'cache');

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    if (!prompt) {
      return message.reply("x Provide a prompt. Usage: {pn} a futuristic city | HORIZONTAL");
    }

    if (prompt.includes("|")) {
      const parts = prompt.split("|").map(p => p.trim());
      prompt = parts[0];
      const orientationInput = parts[1]?.toUpperCase();

      if (orientationInput === "HORIZONTAL" || orientationInput === "VERTICAL") {
        orientation = orientationInput;
      } else if (orientationInput) {
        return message.reply("x Invalid orientation. Use VERTICAL or HORIZONTAL.");
      }
    }

    if (!prompt) {
        return message.reply("x Prompt cannot be empty.");
    }

    message.reaction("⏳", event.messageID);

    try {
      // 1. Send POST request
      const payload = { prompt: prompt, orientation: orientation };
      const apiResponse = await axios.post(API_ENDPOINT, payload, { headers: { 'Content-Type': 'application/json' } });

      const data = apiResponse.data;

      if (!data.success || !data.images || data.images.length < 4) {
        const errorDetail = data.error || data.text_responses?.[0] || "API did not return enough images.";
        throw new Error(`Generation failed: ${errorDetail}`);
      }
      
      const imageUrls = data.images.slice(0, 4).map(img => img.url);
      
      // 2. Create the 2x2 Grid Image
      const gridPath = await createGrid(imageUrls, cacheDir);

      const replyBody = 
          `Meta AI (1-4).\n` +
          `Prompt: ${prompt}\n` +
          `\nReply with 1, 2, 3, or 4 to download the single image.`;

      // 3. Send the message and set the onReply handler
      message.reply({
        body: replyBody,
        attachment: fs.createReadStream(gridPath)
      }, (err, info) => {
        // Cleanup the grid image immediately
        if (fs.existsSync(gridPath)) fs.unlinkSync(gridPath); 
        
        if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
                commandName,
                messageID: info.messageID,
                author: event.senderID,
                imageUrls: imageUrls,
                prompt: prompt
            });
        }
      });
      
      message.reaction("✅", event.messageID); // Successful generation reaction

    } catch (error) {
      message.reaction("x", event.messageID);
      const errorMessage = error.response ? error.response.data.error || error.response.data.detail : error.message;
      console.error("MetaGen Error:", error);
      message.reply(`x Image generation failed: ${errorMessage}`);
    }
  },

  onReply: async function({ message, event, Reply, api }) { 
    const { imageUrls, prompt } = Reply;
    const userReply = event.body.trim();
    const selection = parseInt(userReply);
    const cacheDir = path.join(__dirname, 'cache');
    
    let tempImagePath = '';
    
    if (isNaN(selection) || selection < 1 || selection > 4) {
        api.unsendMessage(Reply.messageID);
        return message.reply("x Invalid selection. Please reply with a number between 1 and 4.");
    }
    
    api.unsendMessage(Reply.messageID);
    
    message.reaction("⏳", event.messageID);

    try {
      const selectedIndex = selection - 1;
      const selectedUrl = imageUrls[selectedIndex];
      
      tempImagePath = await downloadAndSaveFile(selectedUrl, cacheDir);
      
      await message.reply({
        body: `✓ Downloaded Image #${selection}`,
        attachment: fs.createReadStream(tempImagePath)
      });

      message.reaction("✓", event.messageID);

    } catch (error) {
      message.reaction("x", event.messageID);
      console.error("Selection Download Error:", error);
      message.reply(`x Failed to download selected image. Error: ${error.message}`);
    } finally {
      if (tempImagePath && fs.existsSync(tempImagePath)) {
          fs.unlinkSync(tempImagePath);
      }
    }
  }
};