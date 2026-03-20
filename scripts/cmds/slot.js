const dn = 20;
const dp = 30;
const mbet = 6000000;

/* ===== EMOJIS + WEIGHT ===== */
const em = [
  { emoji: "🍒", weight: 30 },
  { emoji: "🍋", weight: 25 },
  { emoji: "🍇", weight: 20 },
  { emoji: "🍉", weight: 15 },
  { emoji: "⭐", weight: 7 },
  { emoji: "7️⃣", weight: 3 }
];

/* ===== FORMAT MONEY ===== */
const fm = (n = 0) => {
  if (n >= 1e15) return (n / 1e15).toFixed(2) + "QT";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return String(n);
};

/* ===== PARSE BET ===== */
const parseBet = (input) => {
  if (!input) return NaN;
  const s = input.toLowerCase();

  if (s.endsWith("qt")) return Number(s.slice(0, -2)) * 1e15;
  if (s.endsWith("t")) return Number(s.slice(0, -1)) * 1e12;
  if (s.endsWith("b")) return Number(s.slice(0, -1)) * 1e9;
  if (s.endsWith("m")) return Number(s.slice(0, -1)) * 1e6;
  if (s.endsWith("k")) return Number(s.slice(0, -1)) * 1e3;

  return Number(s);
};

/* ===== PH DATE ===== */
const getDate = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

/* ===== ROLL SYSTEM ===== */
const roll = () => {
  const total = em.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * total;

  for (const e of em) {
    if (rand < e.weight) return e.emoji;
    rand -= e.weight;
  }
  return em[0].emoji;
};

module.exports = {
  config: {
    name: "slots",
    aliases: ["slot"],
    version: "3.0.0",
    author: "Revised by ChatGPT",
    role: 0,
    category: "game",
    shortDescription: "🎰 Slot Machine",
    guide: {
      en:
        "{pn} <bet>\n" +
        "{pn} info\n" +
        "{pn} top"
    }
  },

  onStart: async function ({ event, args, message, usersData }) {
    const senderID = event.senderID;
    const sub = (args[0] || "").toLowerCase();
    const today = getDate();

    let user = await usersData.get(senderID) || {};
    let money = user.money || 0;

    const isPremium = user.data?.premium?.status === true;
    const dl = isPremium ? dp : dn;

    /* ===== INIT STATS ===== */
    let todayStats = user.data?.slotsToday || {};
    if (todayStats.date !== today) {
      todayStats = { date: today, play: 0, win: 0, lose: 0, winMoney: 0 };
    }

    let allStats = user.data?.slotsAll || { play: 0, win: 0 };

    /* ===== INFO ===== */
    if (sub === "info") {
      const rate = todayStats.play
        ? ((todayStats.win / todayStats.play) * 100).toFixed(1)
        : "0.0";

      return message.reply(
`🎰 SLOT INFO

👤 ${user.name || "Unknown"}
💎 Premium: ${isPremium ? "YES" : "NO"}
🎮 Limit: ${todayStats.play}/${dl}

📊 Played: ${todayStats.play}
🏆 Wins: ${todayStats.win}
💀 Loss: ${todayStats.lose}
📈 Rate: ${rate}%
💰 Win Money: ${fm(todayStats.winMoney)}`
      );
    }

    /* ===== TOP ===== */
    if (sub === "top") {
      const all = await usersData.getAll();

      const top = Object.values(all)
        .map(u => ({
          name: u.name || "Unknown",
          win: u.data?.slotsAll?.win || 0
        }))
        .sort((a, b) => b.win - a.win)
        .slice(0, 10);

      return message.reply(
`🏆 SLOT TOP 10

${top.map((u, i) =>
`#${i + 1} ${u.name} — ${u.win} wins`
).join("\n")}`
      );
    }

    /* ===== BET ===== */
    const bet = parseBet(args[0]);

    if (!bet || isNaN(bet) || bet <= 0)
      return message.reply("❌ Invalid bet.");

    if (bet > mbet)
      return message.reply(`🚫 Max bet: ${fm(mbet)}`);

    if (todayStats.play >= dl)
      return message.reply(`⛔ Daily limit reached (${dl})`);

    if (money < bet)
      return message.reply("💸 Not enough balance.");

    /* ===== SPIN ===== */
    const s1 = roll();
    const s2 = roll();
    const s3 = roll();

    let win = -bet;
    let title = "💀 LOSS";

    if (s1 === s2 && s2 === s3 && s1 === "7️⃣") {
      win = bet * 10;
      title = "🔥 MEGA JACKPOT";
    } else if (s1 === s2 && s2 === s3) {
      win = bet * 5;
      title = "💎 BIG WIN";
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      win = bet * 2;
      title = "✨ WIN";
    }

    /* ===== UPDATE ===== */
    todayStats.play++;
    allStats.play++;

    if (win > 0) {
      todayStats.win++;
      todayStats.winMoney += win;
      allStats.win++;
    } else {
      todayStats.lose++;
    }

    const newBalance = money + win;

    await usersData.set(senderID, {
      money: newBalance,
      data: {
        ...user.data,
        slotsToday: todayStats,
        slotsAll: allStats
      }
    });

    return message.reply(
`🎰 SLOT MACHINE

╭─────────────╮
│ ${s1} │ ${s2} │ ${s3} │
╰─────────────╯

${title}
${win > 0 ? `💰 +${fm(win)}` : `💸 -${fm(bet)}`}

💳 Balance: ${fm(newBalance)}
🎮 Today: ${todayStats.play}/${dl}`
    );
  }
};
