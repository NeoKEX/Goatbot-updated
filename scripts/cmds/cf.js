module.exports = {
  config: {
    name: "coinflip",
    aliases: ["cf"],
    version: "1.2",
    author: "Toshiro Editz",
    countDown: 3,
    role: 0,
    shortDescription: "Flip a coin and win coins",
    longDescription: "Bet coins on a coin flip: Heads (🪙) or Tails (⚡)",
    category: "game",
    guide: "{pn} <bet amount> [h/t]"
  },

  onStart: async function({ message, event, usersData, args }) {
    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) return message.reply("Enter a valid bet amount.");

    const user = await usersData.get(event.senderID);
    if (user.money < bet) return message.reply("Not enough balance.");

    // Optional pick
    let choice = args[1]?.toLowerCase();
    if (!choice || !["h","t","heads","tails"].includes(choice)) {
      choice = Math.random() < 0.5 ? "h" : "t";
    }

    const pick = (choice === "h" || choice === "heads") ? "Heads 🪙" : "Tails ⚡";

    // Flip coin
    const outcomes = ["Heads 🪙", "Tails ⚡"];
    const result = outcomes[Math.floor(Math.random() * 2)];

    const oldBalance = user.money;
    let newBalance;
    let win = false;

    if (pick === result) {
      await usersData.addMoney(event.senderID, bet * 2);
      newBalance = oldBalance + bet * 2;
      win = true;
    } else {
      await usersData.addMoney(event.senderID, -bet);
      newBalance = oldBalance - bet;
      if (newBalance < 0) newBalance = 0;
    }

    // Box style panel
    const line = "━━━━━━━━━━━━━━━━━━━";
    const resultMsg =
`${line}
🎲  Coin Flip
${line}
Your pick   : ${pick}
Result      : ${result}
${line}
Old balance : ${oldBalance}
${win ? `You won 💰 : ${bet*2}` : `You lost 💵 : ${bet}`}
Current bal : ${newBalance} 💸
${line}`;

    return message.reply(resultMsg);
  }
};