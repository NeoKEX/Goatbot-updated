const axios = require("axios");

/* ===== FONT STYLE ===== */
async function toFont(text, id = 3) {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json");
    const apiBase = res.data.apiv1;

    const { data } = await axios.get(
      `${apiBase}/api/font?id=${id}&text=${encodeURIComponent(text)}`
    );

    return data.output || text;
  } catch (e) {
    return text;
  }
}

module.exports = {
  config: {
    name: "flagquiz",
    aliases: ["flag", "fqz", "flagguess"],
    version: "2.0.0",
    author: "Revised by ChatGPT",
    role: 0,
    category: "game",
    shortDescription: "🚩 Flag guessing quiz",
    longDescription: "Guess the country based on the flag.",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const res = await axios.get("https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json");
      const apiBase = res.data.apiv1;

      const { data } = await axios.get(`${apiBase}/api/flag`);
      const { image, options, answer } = data;

      const img = await axios({
        method: "GET",
        url: image,
        responseType: "stream"
      });

      const body = await toFont(
`🚩 FLAG QUIZ
━━━━━━━━━━━━━━
📸 Guess the country:

A. ${options.A}
B. ${options.B}
C. ${options.C}
D. ${options.D}

⏳ Time: 90 seconds
💡 Chances: 3
👉 Reply A / B / C / D`
      );

      api.sendMessage(
        { body, attachment: img.data },
        event.threadID,
        (err, info) => {
          if (err) return;

          /* SAVE REPLY DATA (FIXED) */
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "flagquiz",
            author: event.senderID,
            correctAnswer: answer,
            chances: 3,
            answered: false
          });

          /* TIMEOUT */
          setTimeout(async () => {
            const data = global.GoatBot.onReply.get(info.messageID);

            if (data && !data.answered) {
              await api.unsendMessage(info.messageID);

              const msg = await toFont(
`⏰ Time's up!
✅ Correct answer: ${answer}`
              );

              api.sendMessage(msg, event.threadID);

              global.GoatBot.onReply.delete(info.messageID);
            }
          }, 90000);
        },
        event.messageID
      );

    } catch (err) {
      const msg = await toFont("❌ Failed to fetch flag quiz.");
      api.sendMessage(msg, event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { author, correctAnswer } = Reply;
    let { chances } = Reply;

    const reply = event.body?.trim().toUpperCase();

    /* NOT OWNER */
    if (event.senderID !== author) {
      const msg = await toFont("⚠️ This is not your quiz!");
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    /* INVALID INPUT */
    if (!["A", "B", "C", "D"].includes(reply)) {
      const msg = await toFont("❌ Reply only A, B, C or D.");
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    /* CORRECT */
    if (reply === correctAnswer) {
      const rewardCoin = 300;
      const rewardExp = 100;

      let user = await usersData.get(event.senderID) || {};
      let money = user.money || 0;
      let exp = user.exp || 0;

      await usersData.set(event.senderID, {
        money: money + rewardCoin,
        exp: exp + rewardExp
      });

      global.GoatBot.onReply.delete(Reply.messageID);

      const msg = await toFont(
`🎉 CORRECT!

💰 +${rewardCoin} Coins
🌟 +${rewardExp} EXP

🚩 You're a true flag master!`
      );

      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    /* WRONG */
    chances--;

    if (chances > 0) {
      global.GoatBot.onReply.set(Reply.messageID, {
        ...Reply,
        chances
      });

      const msg = await toFont(
`❌ Wrong answer!
⏳ Chances left: ${chances}`
      );

      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    /* OUT OF CHANCES */
    global.GoatBot.onReply.delete(Reply.messageID);

    const msg = await toFont(
`🥺 Out of chances!
✅ Correct answer: ${correctAnswer}`
    );

    return api.sendMessage(msg, event.threadID, event.messageID);
  }
};
