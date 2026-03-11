const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { getStreamFromURL } = global.utils;

const imgurClientId = "fc9369e9aea767c";

module.exports = {
  config: {
    name: "setrankupimg",
    version: "1.0.1",
    author: "Modified",
    description: {
      vi: "Cấu hình ảnh rankup bằng imgur link hoặc upload từ cache",
      en: "Set rankup image using imgur link or upload from cache"
    },
    category: "system",
    usage: "setrankupimg <link> hoặc setrankupimg upload",
    role: 1
  },

  langs: {
    vi: {
      noImage: "Bạn cần cung cấp link ảnh hoặc dùng lệnh 'upload'",
      success: "Đã cài đặt ảnh rankup thành công!",
      error: "Có lỗi xảy ra",
      uploading: "Đang upload ảnh lên imgur..."
    },
    en: {
      noImage: "You need to provide an image link or use 'upload' command",
      success: "Successfully set rankup image!",
      error: "An error occurred",
      uploading: "Uploading image to imgur..."
    }
  },

  onStart: async function({ api, event, threadsData, args, getLang }) {
    const { threadID, messageID } = event;
    let imageUrl = "";

    // Check if user replied to an attachment
    if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
      const attachment = event.messageReply.attachments[0];
      if (attachment.url) {
        imageUrl = attachment.url;
      }
    }
    // Check if user wants to upload from cache/rankup folder
    else if (args[0] === "upload" || args[0] === "cache") {
      const rankupGifPath = path.join(__dirname, "cache", "rankup");
      
      // Find any image file in the rankup folder
      const extensions = ['.gif', '.jpg', '.jpeg', '.png'];
      let localFile = null;
      
      for (const ext of extensions) {
        const testPath = path.join(rankupGifPath, `rankup${ext}`);
        if (fs.existsSync(testPath)) {
          localFile = testPath;
          break;
        }
      }
      
      if (!localFile) {
        return api.sendMessage(getLang("noImage"), threadID, messageID);
      }
      
      api.sendMessage(getLang("uploading"), threadID, messageID);
      
      try {
        // Read file and upload to imgur
        const fileBuffer = fs.readFileSync(localFile);
        const base64Image = fileBuffer.toString("base64");
        
        const imgurClient = axios.create({
          baseURL: "https://api.imgur.com/3/",
          headers: {
            Authorization: `Client-ID ${imgurClientId}`
          }
        });
        
        const response = await imgurClient.post("image", {
          image: base64Image,
          type: "base64"
        });
        
        imageUrl = response.data.data.link;
      } catch (error) {
        console.error("Imgur upload error:", error);
        return api.sendMessage(getLang("error"), threadID, messageID);
      }
    }
    // Check if user provided a link as argument
    else if (args[0]) {
      imageUrl = args.join(" ");
    }

    if (!imageUrl) {
      return api.sendMessage(getLang("noImage"), threadID, messageID);
    }

    try {
      let finalLink = "";

      // Check if it's already an imgur link - just save it directly
      if (imageUrl.includes("imgur.com") || imageUrl.includes("i.imgur.com")) {
        finalLink = imageUrl;
      }
      else {
        // If not imgur link, download and upload to imgur
        const imgurClient = axios.create({
          baseURL: "https://api.imgur.com/3/",
          headers: {
            Authorization: `Client-ID ${imgurClientId}`
          }
        });

        const stream = await getStreamFromURL(imageUrl);
        
        // Convert stream to base64 for imgur upload
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const base64Image = buffer.toString("base64");

        // Upload to imgur
        const response = await imgurClient.post("image", {
          image: base64Image,
          type: "base64"
        });

        finalLink = response.data.data.link;
      }

      // Save the imgur link to thread data
      await threadsData.set(threadID, finalLink, "data.rankup.imgurLink");

      return api.sendMessage(getLang("success") + `\n📷 Link: ${finalLink}`, threadID, messageID);
    } catch (error) {
      console.error(error);
      return api.sendMessage(getLang("error"), threadID, messageID);
    }
  }
};
