const axios = require("axios");

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "3.0.0",
    author: "Revised by ChatGPT",
    role: 0,
    category: "game",
    shortDescription: "🧠 Quiz Game",
    longDescription: "Answer quiz questions and earn rewards (English only).",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    try {
      // FETCH ENGLISH QUIZ (OpenTDB)
      const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
      const quiz = res.data.results[0];

      // Decode HTML entities (fix weird symbols)
      const decode = (text) =>
        text
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");

      const question = decode(quiz.question);
      const correct = decode(quiz.correct_answer);
      const incorrect = quiz.incorrect_answers.map(decode);

      // Shuffle options
      const allOptions = [...incorrect, correct].sort(() => Math.random() - 0.5);

      const options = {
        a: allOptions[0],
        b: allOptions[1],
        c: allOptions[2],
        d: allOptions[3]
      };

      const body = 
`╭──❖ QUIZ GAME ❖──╮

📜 Question:
${question}

🅐 ${options.a}
🅑 ${options.b}
🅒 ${options.c}
🅓 ${options.d}

────────────────
💡 You have 3 chances!
👉 Reply A / B / C / D
╰───────────────╯`;

      api.sendMessage(
        { body },
        event.threadID,
        (err, info) => {
          if (err) return;

          global.GoatBot.onReply.set(info.messageID, {
            commandName: "quiz",
            author: event.senderID,
            correctAnswer: correct.trim(),
            chances: 3,
            options
          });
        },
        event.messageID
      );

    } catch (err) {
      api.sendMessage("❌ Failed to fetch quiz data.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { author, correctAnswer, options } = Reply;
    let { chances } = Reply;

    const reply = event.body?.trim().toUpperCase();

    // NOT OWNER
    if (event.senderID !== author) {
      return api.sendMessage("⚠️ This is not your quiz!", event.threadID, event.messageID);
    }

    // INVALID INPUT
    if (!["A", "B", "C", "D"].includes(reply)) {
      return api.sendMessage("❌ Reply only A, B, C or D.", event.threadID, event.messageID);
    }

    const selected =
      reply === "A" ? options.a :
      reply === "B" ? options.b :
      reply === "C" ? options.c :
      reply === "D" ? options.d : "";

    // CORRECT
    if (selected.trim() === correctAnswer.trim()) {
      try { await api.unsendMessage(Reply.messageID); } catch {}

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

      return api.sendMessage(
`✅ CORRECT!

🎯 Answer: ${correctAnswer}
💰 +${rewardCoin} Coins
🌟 +${rewardExp} EXP`,
        event.threadID,
        event.messageID
      );
    }

    // WRONG
    chances--;

    if (chances > 0) {
      global.GoatBot.onReply.set(Reply.messageID, {
        ...Reply,
        chances
      });

      return api.sendMessage(
`❌ Wrong answer!
🔁 Chances left: ${chances}`,
        event.threadID,
        event.messageID
      );
    }

    // OUT OF CHANCES
    try { await api.unsendMessage(Reply.messageID); } catch {}

    global.GoatBot.onReply.delete(Reply.messageID);

    return api.sendMessage(
`😢 Out of chances!
✅ Correct answer: ${correctAnswer}`,
      event.threadID,
      event.messageID
    );
  }
};
