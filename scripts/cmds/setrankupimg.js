const axios = require("axios");
const { getStreamFromURL } = global.utils;

const imgurClientId = "fc9369e9aea767c";

module.exports = {
  config: {
    name: "setrankupimg",
    version: "1.0.0",
    author: "Modified",
    description: {
      vi: "Cấu hình ảnh rankup bằng imgur link",
      en: "Set rankup image using imgur link"
    },
    category: "system",
    usage: "setrankupimg <link hoặc reply ảnh>",
    role: 1
  },

  langs: {
    vi: {
      noImage: "Bạn cần cung cấp link ảnh hoặc reply ảnh",
      success: "Đã cài đặt ảnh rankup thành công!",
      error: "Có lỗi xảy ra"
    },
    en: {
      noImage: "You need to provide an image link or reply to an image",
      success: "Successfully set rankup image!",
      error: "An error occurred"
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
