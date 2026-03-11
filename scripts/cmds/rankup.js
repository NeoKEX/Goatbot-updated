const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const imgurClientId = "fc9369e9aea767c";

module.exports = {
  config: {
    name: "rankup",
    version: "1.0.4",
    author: "Mirai Team + Modified",
    description: {
      vi: "Thông báo rankup cho từng nhóm",
      en: "Rankup notification for each group"
    },
    category: "system",
    usage: "rankup [on/off]",
    role: 1
  },

  langs: {
    vi: {
      on: "bật",
      off: "tắt",
      successText: "thành công thông báo rankup!",
      levelup: "★★ Chúc mừng {name} đã đạt level {level}",
      needImg: "Bạn cần cài đặt ảnh rankup trước! Dùng: setrankupimg <link>"
    },
    en: {
      on: "on",
      off: "off", 
      successText: "success notification rankup!",
      levelup: "★★ Congratulations {name} on reaching level {level}!",
      needImg: "You need to set a rankup image first! Use: setrankupimg <link>"
    }
  },

  onStart: async function({ api, event, threadsData, args, getLang }) {
    const { threadID, messageID } = event;
    
    if (args[0] === "on" || args[0] === "off") {
      const isOn = args[0] === "on";
      await threadsData.set(threadID, isOn, "settings.rankupEnabled");
      
      // Also set the message
      const defaultMsg = getLang("levelup");
      await threadsData.set(threadID, defaultMsg, "data.rankup.message");
      
      return api.sendMessage(`${isOn ? getLang("on") : getLang("off")} ${getLang("successText")}`, threadID, messageID);
    }
    
    return api.sendMessage(`Usage: rankup [on/off]`, threadID, messageID);
  },

  onChat: async function({ api, event, usersData, threadsData, message, getLang, globalData }) {
    const { threadID, senderID } = event;
    
    // Check if rankup is enabled for this thread
    const rankupEnabled = await threadsData.get(threadID, "settings.rankupEnabled");
    if (rankupEnabled === false || rankupEnabled === undefined) {
      return;
    }

    // Get current exp and calculate level
    const userData = await usersData.get(senderID);
    const exp = userData?.exp || 0;
    const newExp = exp + 1;
    
    // Calculate level (same formula as original template)
    const curLevel = Math.floor((Math.sqrt(1 + (4 * exp / 3) + 1) / 2));
    const newLevel = Math.floor((Math.sqrt(1 + (4 * newExp / 3) + 1) / 2));

    // Update exp
    await usersData.set(senderID, { exp: newExp });

    // Check if leveled up
    if (newLevel > curLevel && newLevel !== 1) {
      const name = await usersData.getName(senderID) || "User";
      
      // Get custom message or default
      let rankupMessage = await threadsData.get(threadID, "data.rankup.message");
      if (!rankupMessage) {
        rankupMessage = getLang("levelup");
      }
      
      rankupMessage = rankupMessage
        .replace(/{name}/g, name)
        .replace(/{level}/g, newLevel)
        .replace(/{userName}/g, name);

      // Path to rankup GIF folder - ensure it exists
      const rankupGifPath = path.join(__dirname, "cache", "rankup");
      
      // Ensure the directory exists
      if (!fs.existsSync(rankupGifPath)) {
        fs.mkdirSync(rankupGifPath, { recursive: true });
      }
      
      // Convert threadID to string for filename
      const threadIdStr = String(threadID);
      
      // Check for local GIF file - priority: thread-specific > global "rankup.gif"
      let localFilePath = null;
      let fileExt = null;
      
      // First check for thread-specific file (e.g., "123456789.gif")
      const extensions = ['.gif', '.jpg', '.jpeg', '.png'];
      for (const ext of extensions) {
        const testPath = path.join(rankupGifPath, `${threadIdStr}${ext}`);
        if (fs.existsSync(testPath)) {
          localFilePath = testPath;
          fileExt = ext;
          break;
        }
      }
      
      // If no thread-specific file, check for global "rankup.gif" (or rankup.jpg/png)
      if (!localFilePath) {
        for (const ext of extensions) {
          const testPath = path.join(rankupGifPath, `rankup${ext}`);
          if (fs.existsSync(testPath)) {
            localFilePath = testPath;
            fileExt = ext;
            break;
          }
        }
      }
      
      // Check for imgur link as fallback
      const imgurLink = await threadsData.get(threadID, "data.rankup.imgurLink");
      
      // Prepare message
      let messageBody = {
        body: rankupMessage,
        mentions: [{ tag: name, id: senderID }]
      };

      // Try to add attachment from local GIF file or imgur
      if (localFilePath) {
        // Use createReadStream for local files
        const fileStream = fs.createReadStream(localFilePath);
        const fileName = localFilePath.split(path.sep).pop();
        fileStream.path = fileName;
        messageBody.attachment = fileStream;
      } 
      else if (imgurLink) {
        try {
          const { getStreamFromURL } = global.utils;
          const stream = await getStreamFromURL(imgurLink);
          const ext = imgurLink.split('.').pop().split('?')[0];
          stream.path = `rankup_${threadIdStr}.${ext}`;
          messageBody.attachment = stream;
        } catch (e) {
          console.error("Error loading imgur image:", e);
        }
      }

      api.sendMessage(messageBody, threadID);
    }
  }
};
