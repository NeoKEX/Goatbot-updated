module.exports = {
  config: {
    name: "checkrankup",
    version: "1.0.0",
    author: "Debug",
    description: "Check rankup settings",
    category: "system",
    usage: "checkrankup"
  },

  onStart: async function({ api, event, threadsData }) {
    const { threadID, messageID } = event;
    
    const rankupEnabled = await threadsData.get(threadID, "settings.rankupEnabled");
    const rankupMessage = await threadsData.get(threadID, "data.rankup.message");
    const imgurLink = await threadsData.get(threadID, "data.rankup.imgurLink");
    
    let result = "📊 Rankup Settings:\n\n";
    result += `Status: ${rankupEnabled ? "✅ ON" : "❌ OFF"}\n`;
    result += `Message: ${rankupMessage || "none"}\n`;
    result += `Imgur Link: ${imgurLink || "none"}`;
    
    return api.sendMessage(result, threadID, messageID);
  }
};
