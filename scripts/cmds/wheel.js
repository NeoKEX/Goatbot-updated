const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 25;
const MAX_BET = 10000000;
const MIN_BET = 1000;

const WHEEL_SEGMENTS = [
  { label: "🏆 JACKPOT", multiplier: 25, probability: 0.015, type: "jackpot", emoji: "🏆" },
  { label: "💎 DIAMOND", multiplier: 10, probability: 0.025, type: "premium", emoji: "💎" },
  { label: "🔥 MEGA WIN", multiplier: 7, probability: 0.04, type: "big", emoji: "🔥" },
  { label: "⭐ GOLD", multiplier: 5, probability: 0.06, type: "medium", emoji: "⭐" },
  { label: "💰 SILVER", multiplier: 3, probability: 0.10, type: "small", emoji: "💰" },
  { label: "🔔 BRONZE", multiplier: 2, probability: 0.15, type: "tiny", emoji: "🔔" },
  { label: "🍀 LUCKY", multiplier: 1.5, probability: 0.20, type: "mini", emoji: "🍀" },
  { label: "➖ EVEN", multiplier: 1, probability: 0.15, type: "even", emoji: "➖" },
  { label: "😢 HALF", multiplier: 0.5, probability: 0.10, type: "loss", emoji: "😢" },
  { label: "💸 LOSE", multiplier: 0, probability: 0.08, type: "loss", emoji: "💸" },
  { label: "⚡ BANKRUPT", multiplier: 0, probability: 0.07, type: "bankrupt", emoji: "⚡", fee: 0.15 }
];

module.exports = {
  config: {
    name: "wheel",
    aliases: ["spin"],
    version: "1.0",
    author: "zævii魅",
    role: 0,
    countDown: 5,
    shortDescription: "Spin the wheel",
    longDescription: "Bet and spin the wheel",
    category: "game",
    guide: "{pn} <bet> | {pn} stats"
  },

  // ================= START =================
  onStart: async function ({ message, event, args, usersData }) {
    const uid = event.senderID;
    const now = Date.now();

    const user = await usersData.get(uid);

    // ===== INIT DATA =====
    const data = user.data || {};
    const stats = data.wheelStats || {
      totalSpins: 0,
      totalWon: 0,
      totalWagered: 0,
      lastSpins: []
    };

    // ===== STATS COMMAND =====
    if (args[0] === "stats") {
      return message.reply(
        `📊 WHEEL STATS\n\n` +
        `🎡 Spins: ${stats.totalSpins}\n` +
        `💰 Won: ${stats.totalWon}\n` +
        `🎯 Wagered: ${stats.totalWagered}`
      );
    }

    // ===== BET =====
    const bet = parseInt(args[0]);
    if (!bet || bet < MIN_BET)
      return message.reply(`❌ Minimum bet: ${MIN_BET}`);

    if (bet > MAX_BET)
      return message.reply(`❌ Max bet: ${MAX_BET}`);

    if ((user.money || 0) < bet)
      return message.reply("❌ Not enough balance!");

    // ===== LIMIT CHECK =====
    const validSpins = stats.lastSpins.filter(t =>
      now - t < LIMIT_INTERVAL_HOURS * 3600 * 1000
    );

    if (validSpins.length >= MAX_PLAYS) {
      return message.reply("⏰ Spin limit reached. Try again later.");
    }

    // ===== REMOVE BET =====
    const newMoney = user.money - bet;

    // ===== SPIN =====
    let rand = Math.random();
    let sum = 0;
    let result;

    for (const seg of WHEEL_SEGMENTS) {
      sum += seg.probability;
      if (rand <= sum) {
        result = seg;
        break;
      }
    }

    // ===== CALCULATE =====
    let winnings = Math.floor(bet * result.multiplier);

    if (result.type === "bankrupt") {
      winnings = -Math.floor(bet * result.fee);
    }

    const finalMoney = Math.max(0, newMoney + winnings);

    // ===== UPDATE =====
    validSpins.push(now);

    await usersData.set(uid, {
      money: finalMoney,
      data: {
        ...data,
        wheelStats: {
          totalSpins: stats.totalSpins + 1,
          totalWon: stats.totalWon + Math.max(0, winnings),
          totalWagered: stats.totalWagered + bet,
          lastSpins: validSpins.slice(-MAX_PLAYS)
        }
      }
    });

    // ===== RESULT =====
    return message.reply(
      `🎡 WHEEL RESULT\n\n` +
      `🎯 ${result.emoji} ${result.label}\n` +
      `💰 Bet: ${bet}\n` +
      `📈 x${result.multiplier}\n\n` +
      `💵 ${winnings >= 0 ? "+" : ""}${winnings}\n` +
      `💰 Balance: ${finalMoney}\n` +
      `🎡 Spins left: ${MAX_PLAYS - validSpins.length}`
    );
  }
};
