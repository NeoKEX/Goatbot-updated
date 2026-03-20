module.exports = {
  config: {
    name: "dice",
    aliases: ["dicegame", "rolldice", "dg", "dicebet"],
    version: "2.3",
    author: "NC-XNIL (rev by ChatGPT)",
    countDown: 5,
    role: 0,
    category: "economy",
    shortDescription: "🎲 Dice betting game",
    longDescription: "Bet money on dice outcomes",
    guide: "{pn} <bet> <amount> | {pn} <bet1> <bet2> <amount>"
  },

  langs: {
    en: {
      invalid: "❌ Invalid bet. Use high, low, even, odd, 7 or double.",
      min: "❌ Minimum bet is 10.",
      max: "❌ Max bet is %1.",
      noMoney: "❌ Not enough balance. You have %1.",
      usage:
        "🎲 Dice Game\n\n" +
        "Use:\n{pn} dice <bet> <amount>\n{pn} dice <bet1> <bet2> <amount>\n\n" +
        "Example: {pn} dice low odd 300k"
    }
  },

  onStart: async function ({ args, usersData, event, message, getLang, prefix }) {
    const userID = event.senderID;
    const MAX_BET = 1_000_000;

    /* ===== UTIL ===== */

    const parseAmount = (input) => {
      const text = String(input).toLowerCase().trim();
      const match = text.match(/^(\d+(?:\.\d+)?)(k|m|b|t|qt)?$/);
      if (!match) return NaN;

      const num = Number(match[1]);
      const unit = match[2];

      const map = {
        k: 1e3,
        m: 1e6,
        b: 1e9,
        t: 1e12,
        qt: 1e15
      };

      return Math.floor(num * (map[unit] || 1));
    };

    const formatMoney = (n) => {
      if (n >= 1e15) return Math.floor(n / 1e15) + "qt";
      if (n >= 1e12) return Math.floor(n / 1e12) + "t";
      if (n >= 1e9) return Math.floor(n / 1e9) + "b";
      if (n >= 1e6) return Math.floor(n / 1e6) + "m";
      if (n >= 1e3) return Math.floor(n / 1e3) + "k";
      return String(n);
    };

    /* ===== INPUT CHECK ===== */
    if (args.length < 2) {
      return message.reply(
        getLang("usage").replace(/{pn}/g, prefix)
      );
    }

    let bet1, bet2, rawAmount;

    if (args.length === 2) {
      bet1 = args[0].toLowerCase();
      rawAmount = args[1];
    } else {
      bet1 = args[0].toLowerCase();
      bet2 = args[1].toLowerCase();
      rawAmount = args[2];
    }

    const amount = parseAmount(rawAmount);
    const valid = ["high", "low", "even", "odd", "7", "double"];

    if (!valid.includes(bet1) || (bet2 && !valid.includes(bet2))) {
      return message.reply(getLang("invalid"));
    }

    if (!Number.isFinite(amount) || amount < 10) {
      return message.reply(getLang("min"));
    }

    if (amount > MAX_BET) {
      return message.reply(
        getLang("max").replace("%1", formatMoney(MAX_BET))
      );
    }

    const balance = await usersData.getMoney(userID);
    if (balance < amount) {
      return message.reply(
        getLang("noMoney").replace("%1", formatMoney(balance))
      );
    }

    /* ===== PLACE BET ===== */
    await usersData.subtractMoney(userID, amount);

    /* ===== ROLL ===== */
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;

    const check = (b) => {
      if (b === "high") return total >= 8 && total <= 12;
      if (b === "low") return total >= 2 && total <= 6;
      if (b === "even") return total % 2 === 0;
      if (b === "odd") return total % 2 === 1;
      if (b === "7") return total === 7;
      if (b === "double") return dice1 === dice2;
      return false;
    };

    const win = check(bet1) && (bet2 ? check(bet2) : true);

    /* ===== MULTIPLIER ===== */
    let multiplier = 0;
    let title;

    if (win && bet2) {
      multiplier = 5;
      title = "🎉 Big win!";
    } else if (win) {
      if (bet1 === "double") multiplier = 4;
      else if (bet1 === "7") multiplier = 5;
      else multiplier = 2;
      title = "✅ You won!";
    } else {
      title = "❌ Better luck next time!";
    }

    /* ===== PAYOUT ===== */
    let payout = 0;
    if (multiplier > 0) {
      payout = amount * multiplier;
      await usersData.addMoney(userID, payout);
    }

    const newBalance = await usersData.getMoney(userID);

    return message.reply(
      `${title}\n\n` +
      `🎲 Dice: ${dice1} + ${dice2} = ${total}\n` +
      `🎯 Bet: ${[bet1, bet2].filter(Boolean).join(" + ")}\n\n` +
      `${multiplier
        ? `💰 You received ${formatMoney(payout)}`
        : `💸 You lost ${formatMoney(amount)}`}\n` +
      `💳 Balance: ${formatMoney(newBalance)}`
    );
  }
};
