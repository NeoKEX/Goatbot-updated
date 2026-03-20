const fs = require("fs");
const path = require("path");

const balancesFile = path.join(__dirname, "balances.json");

// Load balances or initialize empty
let balances = {};
if (fs.existsSync(balancesFile)) {
  try {
    balances = JSON.parse(fs.readFileSync(balancesFile, "utf8"));
  } catch (e) {
    console.error("Error reading balances.json:", e);
    balances = {};
  }
}

// Utility functions
function saveBalances() {
  fs.writeFileSync(balancesFile, JSON.stringify(balances, null, 2));
}

function getMoney(userID) {
  return balances[userID] || 0;
}

function addMoney(userID, amount) {
  balances[userID] = getMoney(userID) + amount;
  saveBalances();
}

function subtractMoney(userID, amount) {
  balances[userID] = getMoney(userID) - amount;
  saveBalances();
}

function parseAmount(input) {
  const text = String(input).toLowerCase().trim();
  const match = text.match(/^(\d+(?:\.\d+)?)(k|m|b|t|qt)?$/);
  if (!match) return NaN;
  const num = Number(match[1]);
  const map = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, qt: 1e15 };
  return Math.floor(num * (map[match[2]] || 1));
}

function formatMoney(n) {
  if (n >= 1e15) return Math.floor(n / 1e15) + "qt";
  if (n >= 1e12) return Math.floor(n / 1e12) + "t";
  if (n >= 1e9) return Math.floor(n / 1e9) + "b";
  if (n >= 1e6) return Math.floor(n / 1e6) + "m";
  if (n >= 1e3) return Math.floor(n / 1e3) + "k";
  return String(n);
}

// Dice game command
module.exports = {
  config: {
    name: "dice",
    aliases: ["dicegame", "rolldice", "dg", "dicebet"],
    version: "2.2.5",
    author: "NC-XNIL",
    role: 0,
    usePrefix: true,
    category: "economy",
    description: "🎲 Dice betting game",
    guide: {
      en: "Usage:\n{pn} <bet> <amount>\n{pn} <bet1> <bet2> <amount>\nAmount suffixes: k,m,b,t,qt\nExample: {pn} low odd 300k"
    }
  },

  ncStart: async function ({ args, message, event }) {
    const userID = event.senderID;
    const MAX_BET = 1_000_000;

    if (args.length < 2) {
      return message.reply(`🎲 Dice Game\nUsage:\n${this.config.guide.en}`);
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
      return message.reply("Invalid bet. Use high, low, even, odd, 7 or double.");
    }

    if (!Number.isFinite(amount) || amount < 10) {
      return message.reply("Minimum bet is 10.");
    }

    if (amount > MAX_BET) {
      return message.reply(`Max bet is ${formatMoney(MAX_BET)}.`);
    }

    const balance = getMoney(userID);
    if (balance < amount) {
      return message.reply(`Not enough balance. You have ${formatMoney(balance)}.`);
    }

    // Deduct bet
    subtractMoney(userID, amount);

    // Roll dice
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

    let multiplier = 0;
    let title = "❌ Better luck next time";

    if (win && bet2) {
      multiplier = 5;
      title = "🎉 Big win";
    } else if (win) {
      if (bet1 === "double") multiplier = 4;
      else if (bet1 === "7") multiplier = 5;
      else multiplier = 2;
      title = "✅ You won";
    }

    let payout = 0;
    if (multiplier > 0) {
      payout = amount * multiplier;
      addMoney(userID, payout);
    }

    const newBalance = getMoney(userID);

    return message.reply(
      `${title}\n🎲 Dice: ${dice1} + ${dice2} = ${total}\n🎯 Bet: ${[bet1, bet2].filter(Boolean).join(" + ")}\n` +
      `${multiplier ? `You received ${formatMoney(payout)}` : `You lost ${formatMoney(amount)}`}\n💳 Balance: ${formatMoney(newBalance)}`
    );
  }
};
