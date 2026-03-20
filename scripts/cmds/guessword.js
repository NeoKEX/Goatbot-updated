module.exports = {
  config: {
    name: "guessword",
    aliases: ["gw"],
    version: "1.0",
    author: "ChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: "Guess the hidden word",
    longDescription: "Guess the word letter by letter or whole word",
    category: "game",
    guide: "{pn} (start game)"
  },

  // ================= START =================
  onStart: async function ({ message, event, commandName }) {
    const words = [
      "apple","banana","orange","grapes","cherry",
      "mango","pineapple","watermelon","peach","lemon",
      "strawberry","blueberry","coconut","papaya","kiwi"
    ];

    const word = words[Math.floor(Math.random() * words.length)];
    const hidden = "_ ".repeat(word.length).trim();

    const reply = await message.reply(
      `🔤 GUESS THE WORD\n\n${hidden}\n\nReply with:\n• a letter\n• or the whole word\n\n❤️ Attempts: 6`
    );

    global.GoatBot.onReply.set(reply.messageID, {
      commandName,
      author: event.senderID,
      word,
      guessed: [],
      attempts: 6,
      display: hidden.split(" ")
    });
  },

  // ================= REPLY =================
  onReply: async function ({ message, event, Reply, usersData }) {
    const { author, word } = Reply;
    if (event.senderID !== author) return;

    let input = event.body.toLowerCase().trim();

    // ===== GUESS WHOLE WORD =====
    if (input.length > 1) {
      if (input === word) {
        const reward = 500;
        const user = await usersData.get(event.senderID);
        await usersData.set(event.senderID, {
          money: (user.money || 0) + reward,
          exp: user.exp,
          data: user.data
        });

        global.GoatBot.onReply.delete(event.messageID);
        return message.reply(`🎉 Correct! The word was "${word}"\n💰 +${reward} coins`);
      } else {
        Reply.attempts--;
      }
    }

    // ===== GUESS LETTER =====
    else {
      if (Reply.guessed.includes(input)) {
        return message.reply("⚠️ You already guessed that letter!");
      }

      Reply.guessed.push(input);

      let correct = false;

      for (let i = 0; i < word.length; i++) {
        if (word[i] === input) {
          Reply.display[i] = input;
          correct = true;
        }
      }

      if (!correct) Reply.attempts--;
    }

    // ===== CHECK WIN =====
    if (!Reply.display.includes("_")) {
      const reward = 300;
      const user = await usersData.get(event.senderID);
      await usersData.set(event.senderID, {
        money: (user.money || 0) + reward,
        exp: user.exp,
        data: user.data
      });

      global.GoatBot.onReply.delete(event.messageID);
      return message.reply(`🎉 You completed the word: ${word}\n💰 +${reward} coins`);
    }

    // ===== GAME OVER =====
    if (Reply.attempts <= 0) {
      global.GoatBot.onReply.delete(event.messageID);
      return message.reply(`💀 Game Over!\nThe word was: ${word}`);
    }

    // ===== CONTINUE =====
    global.GoatBot.onReply.delete(event.messageID);

    const newReply = await message.reply(
      `🔤 ${Reply.display.join(" ")}\n\n❌ Attempts left: ${Reply.attempts}\n\nGuessed: ${Reply.guessed.join(", ")}`
    );

    global.GoatBot.onReply.set(newReply.messageID, Reply);
  }
};
