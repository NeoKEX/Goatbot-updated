const mbet = 1000000;
const dln = 20;
const dlp = 30;

/* ===== FORMAT MONEY ===== */
const fm = (n = 0) => {
  if (n >= 1e15) return (n / 1e15).toFixed(2) + "QT";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "Q";
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
  if (s.endsWith("q")) return Number(s.slice(0, -1)) * 1e12;
  if (s.endsWith("b")) return Number(s.slice(0, -1)) * 1e9;
  if (s.endsWith("m")) return Number(s.slice(0, -1)) * 1e6;
  if (s.endsWith("k")) return Number(s.slice(0, -1)) * 1e3;

  return Number(s);
};

/* ===== DATE RESET (PH TIME) ===== */
const getDate = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

module.exports = {
  config: {
    name: "colorpick",
    aliases: ["cp"],
    version: "3.0.0",
    author: "Revised by ChatGPT",
    role: 0,
    category: "game",
    shortDescription: "🎨 Pick a color & win money",
    longDescription: "Choose 1 of 3 colors. Guess correctly to win your bet.",
    guide: {
      en:
        "{pn} <bet>\n" +
        "{pn} info\n" +
        "{pn} top\n" +
        "Example: {pn} 1k | 1m | 1b"
    }
  },

  onStart: async function ({ api, event, usersData, args }) {
    const { senderID, threadID } = event;
    const sub = (args[0] || "").toLowerCase();
    const today = getDate();

    let user = await usersData.get(senderID) || {};
    let money = user.money || 0;

    const isPremium = user.data?.premium?.status === true;
    const dailyLimit = isPremium ? dlp : dln;

    let todayStats = user.data?.colorToday || {};
    if (todayStats.date !== today) {
      todayStats = { date: today, play: 0, win: 0, lose: 0 };
    }

    let allStats = user.data?.colorAll || { win: 0 };

    /* ===== INFO ===== */
    if (sub === "info") {
      const rate = todayStats.play
        ? ((todayStats.win / todayStats.play) * 100).toFixed(1)
        : "0.0";

      return api.sendMessage(
`🎨 COLORPICK INFO

👤 User     : ${user.name || "Unknown"}
💎 Premium  : ${isPremium ? "YES" : "NO"}
🎮 Limit    : ${todayStats.play}/${dailyLimit}

📊 Played   : ${todayStats.play}
🏆 Wins     : ${todayStats.win}
💀 Loss     : ${todayStats.lose}
📈 Rate     : ${rate}%`,
        threadID
      );
    }

    /* ===== TOP ===== */
    if (sub === "top") {
      const all = await usersData.getAll();

      const top = Object.values(all)
        .map(u => ({
          name: u.name || "Unknown",
          win: u.data?.colorAll?.win || 0
        }))
        .sort((a, b) => b.win - a.win)
        .slice(0, 10);

      return api.sendMessage(
`🏆 TOP COLORPLAYERS

${top.map((u, i) =>
`#${i + 1} ${u.name} — ${u.win} wins`
).join("\n")}`,
        threadID
      );
    }

    /* ===== BET VALIDATION ===== */
    const bet = parseBet(args[0]);

    if (!bet || isNaN(bet) || bet <= 0)
      return api.sendMessage("❌ Invalid bet.", threadID);

    if (bet > mbet)
      return api.sendMessage(`🚫 Max bet: ${fm(mbet)}`, threadID);

    if (todayStats.play >= dailyLimit)
      return api.sendMessage(`⛔ Daily limit reached (${dailyLimit})`, threadID);

    if (money < bet)
      return api.sendMessage("💸 Not enough balance.", threadID);

    /* ===== GAME ===== */
    const colors = [
      "🔥","💧","🌿","⚡","💠","🌸","🌙",
      "🖤","🤍","💛","💙","💚","💜","🧡","❤️",
      "✨","🌱","🌺","☘️"
    ];

    const options = [];
    while (options.length < 3) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      if (!options.includes(c)) options.push(c);
    }

    const correct = options[Math.floor(Math.random() * 3)];
    todayStats.play++;

    await usersData.set(senderID, {
      data: {
        ...user.data,
        colorToday: todayStats,
        colorAll: allStats
      }
    });

    return api.sendMessage(
`🎨 COLOR PICK

1️⃣ ${options[0]}
2️⃣ ${options[1]}
3️⃣ ${options[2]}

💰 Bet   : ${fm(bet)}
🎮 Limit : ${todayStats.play}/${dailyLimit}

👉 Reply: 1 / 2 / 3`,
      threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "colorpick",
          author: senderID,
          bet,
          options,
          correct
        });
      }
    );
  },

  onReply: async function ({ event, api, usersData, Reply }) {
    if (event.senderID !== Reply.author) return;

    const pick =
      event.body === "1" ? Reply.options[0] :
      event.body === "2" ? Reply.options[1] :
      event.body === "3" ? Reply.options[2] : null;

    if (!pick) return;

    const user = await usersData.get(event.senderID);
    let money = user.money || 0;

    const todayStats = user.data.colorToday;
    const allStats = user.data.colorAll;

    if (pick === Reply.correct) {
      await usersData.addMoney(event.senderID, Reply.bet);
      todayStats.win++;
      allStats.win++;

      return api.sendMessage(
`🎉 YOU WIN

✔ Pick    : ${pick}
🎯 Correct : ${Reply.correct}

💰 Won     : ${fm(Reply.bet)}
💳 Balance : ${fm(money + Reply.bet)}`,
        event.threadID
      );
    } else {
      await usersData.addMoney(event.senderID, -Reply.bet);
      todayStats.lose++;

      return api.sendMessage(
`💀 YOU LOSE

❌ Pick    : ${pick}
🎯 Correct : ${Reply.correct}

💸 Lost    : ${fm(Reply.bet)}
💳 Balance : ${fm(money - Reply.bet)}`,
        event.threadID
      );
    }
  }
};
