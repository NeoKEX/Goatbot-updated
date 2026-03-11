const axios = require("axios");

module.exports = {
  config: {
    name: "imgur",
    version: "1.0.0",
    author: "VincentSensei",
    description: "Upload image/video to Imgur",
    category: "tools",
    usage: "imgur [reply to image/video]",
    guide: {
      en: "Reply to a photo/video/gif with {pn} to upload it to Imgur"
    },
    role: 0,
    countDown: 0
  },

  onStart: async function({ message, event, api }) {
    const array = [];

    if (event.type !== "message_reply" || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return message.reply("Please reply with the photo/video/gif that you need to upload");
    }

    const clientId = "fc9369e9aea767c";
    const client = axios.create({
      baseURL: "https://api.imgur.com/3/",
      headers: {
        Authorization: `Client-ID ${clientId}`
      }
    });

    async function uploadImage(url) {
      try {
        const response = await client.post("image", { image: url });
        return response.data.data.link;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to upload image to Imgur");
      }
    }

    for (const attachment of event.messageReply.attachments) {
      try {
        const res = await uploadImage(attachment.url);
        array.push(res);
      } catch (err) {
        console.error(err);
      }
    }

    const successCount = array.length;
    const failedCount = event.messageReply.attachments.length - array.length;

    let resultMessage = `Uploaded successfully ${successCount} image(s)\nFailed to upload: ${failedCount}`;
    if (array.length > 0) {
      resultMessage += `\nImage link: \n${array.join("\n")}`;
    }

    return message.reply(resultMessage);
  }
};
