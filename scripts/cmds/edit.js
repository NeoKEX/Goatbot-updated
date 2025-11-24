const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

const API_ENDPOINT = "https://tawsif.is-a.dev/gemini/nano-banana"; 

function extractImageUrl(message, args, event) {
    let imageUrl = args.find(arg => arg.startsWith('http'));

    if (!imageUrl && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        const imageAttachment = event.messageReply.attachments.find(att => att.type === 'photo' || att.type === 'image');
        if (imageAttachment && imageAttachment.url) {
            imageUrl = imageAttachment.url;
        }
    }
    return imageUrl;
}

function extractEditPrompt(rawArgs, imageUrl) {
    let prompt = rawArgs.join(" ");
    
    if (imageUrl) {
        prompt = prompt.replace(imageUrl, '').trim();
    }
    
    if (prompt.includes('|')) {
        prompt = prompt.split('|')[0].trim();
    }

    return prompt || "enhance quality";
}


module.exports = {
  config: {
    name: "edit",
    aliases: ["imgedit", "nanoedit"],
    version: "2.3",
    author: "NeoKEX",
    countDown: 15,
    role: 0,
    longDescription: "Edit or modify an existing image using a text prompt.",
    category: "ai-image",
    guide: {
      en: "{pn} [modification prompt] OR reply to an image with [modification prompt]"
    }
  },

  onStart: async function({ message, args, event }) {
    
    const imageUrl = extractImageUrl(message, args, event);
    const editPrompt = extractEditPrompt(args, imageUrl);

    if (!imageUrl) {
      return message.reply("❌ Please provide an image URL or reply to an image to edit.");
    }
    if (!editPrompt) {
        return message.reply("❌ Please provide a prompt describing the modification you want to make.");
    }

    message.reaction("⏳", event.messageID);
    let tempFilePath; 

    try {
      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(editPrompt)}&url=${encodeURIComponent(imageUrl)}`;
      
      const apiResponse = await axios.get(fullApiUrl);
      const data = apiResponse.data;

      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || "API returned success: false or missing image URL.");
      }

      const finalImageUrl = data.imageUrl;

      const imageDownloadResponse = await axios.get(finalImageUrl, {
          responseType: 'stream',
      });
      
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      
      tempFilePath = path.join(cacheDir, `edited_nano_${Date.now()}.png`);
      
      const writer = fs.createWriteStream(tempFilePath);
      imageDownloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", (err) => {
          writer.close();
          reject(err);
        });
      });

      message.reaction("✅", event.messageID);
      await message.reply({
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "An error occurred during image editing.";
      if (error.response && error.response.data && error.response.data.error) {
         errorMessage += ` (API Error: ${error.response.data.error})`;
      } else if (error.message) {
         errorMessage = `❌ ${error.message}`;
      } else if (error.code) {
         errorMessage = `❌ Network Error: ${error.code}`;
      }

      console.error("Edit Command Error:", error);
      message.reply(`❌ ${errorMessage}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
      }
    }
  }
};