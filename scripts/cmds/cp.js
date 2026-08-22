const fs = require("fs-extra");

module.exports = {
  config: {
    name: "colorpick",
    aliases: ["cp"],
    version: "1.2",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    shortDescription: "Pick a color and win coins",
    longDescription: "Color guessing game with 25+ aesthetic emojis",
    category: "game",
    guide: "{pn} <bet amount>"
  },

  onStart: async function ({ message, event, usersData, args }) {
    const bet = parseInt(args[0]);
    if (!bet || bet <= 0)
      return message.reply("Enter a valid bet amount.");

    const user = await usersData.get(event.senderID);
    if (user.money < bet)
      return message.reply("Not enough balance.");

    const colors = [
      "🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘",
      "🔥","💧","🌿","⚡","💠","🌸","🌙",
      "🖤","🤍","💛","💙","💚","💜","🧡","❤️",
      "🩶","💫","✨","⚡","🌱","🌿","🏵️","🌸","🪷","🌺","☘️",
    ];

    // choose 3 random colors
    const options = [];
    while (options.length < 3) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      if (!options.includes(c)) options.push(c);
    }

    const correct = options[Math.floor(Math.random() * options.length)];

    message.reply(
      "Color Pick\n\n" +
      "1 " + options[0] + "\n" +
      "2 " + options[1] + "\n" +
      "3 " + options[2] + "\n\n" +
      "Reply with 1, 2, or 3 within 30 seconds.",
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "colorpick",
          messageID: info.messageID,
          author: event.senderID,
          bet,
          options,
          correct,
          oldBalance: user.money // store old balance
        });
      }
    );
  },

  onReply: async function ({ Reply, message, event, usersData }) {
    if (event.senderID !== Reply.author) return;

    const choice = event.body.trim();
    let pick;
    if (choice === "1") pick = Reply.options[0];
    else if (choice === "2") pick = Reply.options[1];
    else if (choice === "3") pick = Reply.options[2];
    else return message.reply("Choose 1, 2, or 3.");

    const correct = Reply.correct;
    const bet = Reply.bet;
    const oldBalance = Reply.oldBalance;
    let newBalance;

    if (pick === correct) {
      await usersData.addMoney(event.senderID, bet);
      newBalance = oldBalance + bet;
      return message.reply(
        "Result\n" +
        "Your pick: " + pick + "\n" +
        "Correct: " + correct + "\n\n" +
        "Your old balance: " + oldBalance + "\n" +
        "You won 💰: " + bet + "\n" +
        "Current balance 💸: " + newBalance
      );
    } else {
      await usersData.addMoney(event.senderID, -bet);
      newBalance = oldBalance - bet;
      if(newBalance < 0) newBalance = 0;
      return message.reply(
        "Result\n" +
        "Your pick: " + pick + "\n" +
        "Correct: " + correct + "\n\n" +
        "Your old balance: " + oldBalance + "\n" +
        "You lost 💵: " + bet + "\n" +
        "Current balance 💸: " + newBalance
      );
    }
  }
};