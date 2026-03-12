module.exports = {
  config: {
    name: "activemember",
    aliases: ["am"],
    version: "1.0",
    author: "VincentSensei",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Top 15 most active members" },
    longDescription: { en: "Get the top 15 users by message count in the current chat" },
    category: "box chat",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, message }) {
    const { threadID, senderID } = event;

    try {
      message.reaction("⏳", event.messageID);

      const threadInfo = await api.getThreadInfo(threadID);
      const messageCounts = {};

      threadInfo.participantIDs.forEach(id => {
        messageCounts[id] = 0;
      });

      const messages = await api.getThreadHistory(threadID, 1000);

      messages.forEach(msg => {
        if (messageCounts[msg.senderID] !== undefined) {
          messageCounts[msg.senderID]++;
        }
      });

      const topUsers = Object.entries(messageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      const userList = [];
      for (const [userId, count] of topUsers) {
        const info = await api.getUserInfo(userId);
        const name = info[userId]?.name || "Unknown";
        userList.push(`『${name}』\nSent ${count} messages`);
      }

      const body = `💁 Active Members:\n\n${userList.join("\n\n")}`;

      message.reaction("✅", event.messageID);
      return message.reply({
        body,
        mentions: [{ tag: "@" + senderID, id: senderID, type: "user" }]
      });

    } catch (error) {
      console.error("[ActiveMember] Error:", error.message);
      message.reaction("❌", event.messageID);
      return message.reply("❌ Failed to fetch active members. Please try again.");
    }
  }
};
