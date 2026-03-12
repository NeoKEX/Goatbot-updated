const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const imgurClientId = "fc9369e9aea767c";

module.exports = {
  config: {
    name: "rankup",
    version: "1.1.1",
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
    
    // Show current status if no args
    if (!args[0]) {
      const rankupEnabled = await threadsData.get(threadID, "settings.rankupEnabled");
      const status = rankupEnabled ? "ON" : "OFF";
      return api.sendMessage(`📊 Rankup Status: ${status}\nUse: rankup [on/off]`, threadID, messageID);
    }
    
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

  onChat: async function({ api, event, usersData, threadsData, message, getLang }) {
    const { threadID, senderID } = event;
    
    // Check if rankup is enabled for this thread (enabled by default)
    const rankupEnabled = await threadsData.get(threadID, "settings.rankupEnabled");
    if (rankupEnabled === false) {
      return;
    }

    // Get current exp and increment it
    const userData = await usersData.get(senderID);
    const exp = (userData?.exp || 0) + 1;
    
    // Update exp
    await usersData.set(senderID, { exp });
    
    // Calculate level before and after
    const prevExp = Math.max(0, exp - 1);
    const prevLevel = Math.floor((Math.sqrt(1 + (4 * prevExp / 3) + 1) / 2));
    const currentLevel = Math.floor((Math.sqrt(1 + (4 * exp / 3) + 1) / 2));

    // Check if leveled up (current level > previous level, and not level 1)
    if (currentLevel > prevLevel && currentLevel !== 1) {
      const name = await usersData.getName(senderID) || "User";
      
      // Get custom message or default
      let rankupMessage = await threadsData.get(threadID, "data.rankup.message");
      if (!rankupMessage) {
        rankupMessage = getLang("levelup");
      }
      
      rankupMessage = rankupMessage
        .replace(/{name}/g, name)
        .replace(/{level}/g, currentLevel)
        .replace(/{userName}/g, name);

      // Use message.reply like other commands do
      let replyBody = {
        body: rankupMessage,
        mentions: [{ tag: name, id: senderID }]
      };

      try {
        const { getStreamFromURL } = global.utils;
        const stream = await getStreamFromURL(`https://rankup-api-b1rv.vercel.app/api/rankup?uid=${senderID}`);
        stream.path = 'rankup.gif';
        replyBody.attachment = stream;
      } catch (e) {
        console.error("Error loading rankup image from API:", e);
      }

      message.reply(replyBody);
    }
  }
};
