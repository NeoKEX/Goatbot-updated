const axios = require("axios");

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "1.1",
    author: "NC-Saim",
    team: "GoatBot",
    countDown: 10,
    role: 0,
    guide: { en: "{pn} — Answer quiz questions and earn rewards!" }
  },

  ncStart: async function ({ api, event }) {
    try {
      const apiRaw = await axios.get("https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json");
      const quizApiBase = apiRaw.data.apiv1;

      const { data } = await axios.get(`${quizApiBase}/api/quiz`);
      const { question, options, answer } = data;

      const body = `╭──❖  𝐐𝐔𝐈𝐙 𝐆𝐀𝐌𝐄  ❖──╮
📜 Question: ${question}

🅐 ${options.a}
🅑 ${options.b}
🅒 ${options.c}
🅓 ${options.d}

────────────────
💡 You have 3 chances to answer!
(Reply with A, B, C or D)
╰───────────────╯`;

      api.sendMessage(
        { body },
        event.threadID,
        async (err, info) => {
          if (err) return;

          global.goatBot.ncReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            correctAnswer: answer.trim(),
            chances: 3,
            answered: false,
            options
          });
        },
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to fetch quiz data!", event.threadID, event.messageID);
    }
  },

  ncReply: async function ({ api, event, Reply, usersData }) {
    let { author, correctAnswer, messageID, chances, options } = Reply;
    const reply = event.body?.trim().toUpperCase();

    if (event.senderID !== author)
      return api.sendMessage("⚠️ This quiz is not for you!", event.threadID, event.messageID);

    if (!reply || !["A", "B", "C", "D"].includes(reply))
      return api.sendMessage("❌ Please reply only with A, B, C, or D!", event.threadID, event.messageID);

    const selectedText =
      reply === "A" ? options.a :
      reply === "B" ? options.b :
      reply === "C" ? options.c :
      reply === "D" ? options.d : "";

    if (selectedText.trim() === correctAnswer.trim()) {
      try { await api.unsendMessage(messageID); } catch {}

      const rewardCoin = 300;
      const rewardExp = 100;

      const userData = await usersData.get(event.senderID);
      userData.money = (userData.money || 0) + rewardCoin;
      userData.exp = (userData.exp || 0) + rewardExp;
      await usersData.set(event.senderID, userData);

      const correctMsg = `╭──✅  𝐐𝐔𝐈𝐙 𝐑𝐄𝐒𝐔𝐋𝐓  ✅──╮
│ Status     : Correct Answer!
│ Answer     : ${correctAnswer}
│ Reward     : +${rewardCoin} Coins
│ Experience : +${rewardExp} EXP
│ 🏆 Well done!
╰───────────────╯`;

      global.goatBot.ncReply.delete(messageID);
      return api.sendMessage(correctMsg, event.threadID, event.messageID);

    } else {
      chances--;

      if (chances > 0) {
        global.goatBot.ncReply.set(messageID, { ...Reply, chances });
        return api.sendMessage(`❌ Wrong answer! 🔁 You have ${chances} chances left. Try again!`, event.threadID, event.messageID);
      } else {
        try { await api.unsendMessage(messageID); } catch {}
        const wrongMsg = `😢 No chances left!
✅ The correct answer was ➤ ${correctAnswer}`;
        return api.sendMessage(wrongMsg, event.threadID, event.messageID);
      }
    }
  }
};
