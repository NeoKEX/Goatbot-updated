const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 25;
const MAX_BET = 10_000_000;
const MIN_BET = 1000;

// Premium wheel segments with enhanced probabilities
const WHEEL_SEGMENTS = [
  { label: "🏆 JACKPOT", multiplier: 25, probability: 0.015, type: "jackpot", emoji: "🏆", color: "#FFD700" },
  { label: "💎 DIAMOND", multiplier: 10, probability: 0.025, type: "premium", emoji: "💎", color: "#B9F2FF" },
  { label: "🔥 MEGA WIN", multiplier: 7, probability: 0.04, type: "big", emoji: "🔥", color: "#FF7F00" },
  { label: "⭐ GOLD", multiplier: 5, probability: 0.06, type: "medium", emoji: "⭐", color: "#FFD700" },
  { label: "💰 SILVER", multiplier: 3, probability: 0.10, type: "small", emoji: "💰", color: "#C0C0C0" },
  { label: "🔔 BRONZE", multiplier: 2, probability: 0.15, type: "tiny", emoji: "🔔", color: "#CD7F32" },
  { label: "🍀 LUCKY", multiplier: 1.5, probability: 0.20, type: "mini", emoji: "🍀", color: "#00FF00" },
  { label: "➖ BREAK EVEN", multiplier: 1, probability: 0.15, type: "even", emoji: "➖", color: "#808080" },
  { label: "😢 HALF LOSS", multiplier: 0.5, probability: 0.10, type: "loss", emoji: "😢", color: "#FF6B6B" },
  { label: "💸 TOTAL LOSS", multiplier: 0, probability: 0.08, type: "loss", emoji: "💸", color: "#FF0000" },
  { label: "⚡ BANKRUPT", multiplier: 0, probability: 0.07, type: "bankrupt", emoji: "⚡", color: "#800080", fee: 0.15 }
];

// Special events with low probability
const SPECIAL_EVENTS = [
  { name: "DOUBLE TROUBLE", trigger: 0.02, effect: (multiplier) => multiplier * 2 },
  { name: "TRIPLE THREAT", trigger: 0.005, effect: (multiplier) => multiplier * 3 },
  { name: "LUCKY CLOVER", trigger: 0.03, effect: (multiplier) => multiplier + 0.5 },
  { name: "GOLDEN SPIN", trigger: 0.01, effect: (multiplier) => multiplier * 1.5 }
];

module.exports = {
  config: {
    name: "wheel",
    version: "5.0",
    author: "NC-XNIL | NC-FAHAD ",
    shortDescription: "🎡 Wheel of Fortune",
    longDescription: "Spin the ultimate wheel with progressive jackpots, special events, and massive rewards!",
    category: "game",
    guide: {
      en: "{p}wheel <bet> | {p}wheel info | {p}wheel stats | {p}wheel leaderboard | {p}wheel jackpot"
    }
  },

  ncStart: async function ({ api, event, args, usersData, commandName }) {
    const { senderID, threadID, messageID } = event;
    const command = args[0]?.toLowerCase();

    // ========== INFO COMMAND ==========
    if (command === 'info') {
      const infoMessage = `
🎡 ━━━━━━━━━━━━━━━━━━━━━ 🎡
       WHEEL OF FORTUNE
           v5.0 PREMIUM
🎡 ━━━━━━━━━━━━━━━━━━━━━ 🎡

💰 BET RANGE: ${MIN_BET.toLocaleString()} - ${MAX_BET.toLocaleString()}
🎯 MAX SPINS: ${MAX_PLAYS} every ${LIMIT_INTERVAL_HOURS} hours
🎊 PROGRESSIVE JACKPOT: Grows with every spin!

━━━━━━ WHEEL SEGMENTS ━━━━━━
${WHEEL_SEGMENTS.map(seg => 
  `• ${seg.emoji} ${seg.label.padEnd(15)} x${seg.multiplier} (${(seg.probability * 100).toFixed(1)}%)`
).join('\n')}

━━━━━━ SPECIAL FEATURES ━━━━━━
• 🎰 Random Multipliers (2x-3x)
• 🔥 Win Streak Bonuses
• 🏆 Progressive Jackpot Pool
• ⚡ Daily Bonus Spins
• 🎁 Mystery Box Rewards

━━━━━━ COMMANDS ━━━━━━
• ${commandName} <amount>   - Spin the wheel
• ${commandName} info       - Show this info
• ${commandName} stats      - Your statistics
• ${commandName} leaderboard - Top players
• ${commandName} jackpot    - Current jackpot

🎯 TIP: Higher bets increase jackpot contribution!
      `.trim();
      return api.sendMessage(infoMessage, threadID, messageID);
    }

    // ========== STATS COMMAND ==========
    if (command === 'stats') {
      const user = await usersData.get(senderID);
      const stats = user.data?.wheelStats || {
        totalSpins: 0,
        totalWon: 0,
        totalWagered: 0,
        biggestWin: 0,
        currentStreak: 0,
        highestStreak: 0,
        jackpotsWon: 0
      };

      const winRate = stats.totalSpins > 0 
        ? ((stats.totalWon / stats.totalWagered) * 100).toFixed(2)
        : 0;

      const statsMessage = `
📊 ━━━━━━━ YOUR WHEEL STATS ━━━━━━ 📊

🎡 TOTAL SPINS: ${stats.totalSpins}
💰 TOTAL WON: ${stats.totalWon.toLocaleString()}
🎯 TOTAL WAGERED: ${stats.totalWagered.toLocaleString()}
📈 WIN RATE: ${winRate}%
🏆 BIGGEST WIN: ${stats.biggestWin.toLocaleString()}
🔥 CURRENT STREAK: ${stats.currentStreak}
⚡ HIGHEST STREAK: ${stats.highestStreak}
🎰 JACKPOTS WON: ${stats.jackpotsWon || 0}

━━━━━━ RECENT ACTIVITY ━━━━━━
${stats.lastSpins?.slice(-5).map((spin, i) => 
  `• Spin ${i+1}: ${spin.result || "N/A"}`
).join('\n') || "No recent spins"}
      `.trim();

      return api.sendMessage(statsMessage, threadID, messageID);
    }

    // ========== LEADERBOARD COMMAND ==========
    if (command === 'leaderboard') {
      const allUsers = await usersData.getAll();
      const leaderboardData = allUsers
        .filter(user => user.data?.wheelStats?.totalSpins > 0)
        .map(user => {
          const stats = user.data.wheelStats;
          const netProfit = stats.totalWon - (stats.totalWagered || 0);
          return {
            name: user.name,
            uid: user.id,
            netProfit: netProfit,
            totalWon: stats.totalWon || 0,
            totalSpins: stats.totalSpins || 0,
            jackpots: stats.jackpotsWon || 0
          };
        })
        .sort((a, b) => b.netProfit - a.netProfit)
        .slice(0, 10);

      let leaderboardMsg = "🏆 ━━━━━━━ WHEEL LEADERBOARD ━━━━━━ 🏆\n\n";
      leaderboardData.forEach((user, index) => {
        const medals = ["🥇", "🥈", "🥉"];
        const medal = medals[index] || `▫️`;
        const profitIcon = user.netProfit >= 0 ? "💰" : "📉";

        leaderboardMsg += `${medal} ${user.name}\n`;
        leaderboardMsg += `   ${profitIcon} Net Profit: ${user.netProfit.toLocaleString()}\n`;
        leaderboardMsg += `   🎡 Spins: ${user.totalSpins}\n`;
        leaderboardMsg += `   🏅 Jackpots: ${user.jackpots}\n`;
        leaderboardMsg += `   📊 Total Won: ${user.totalWon.toLocaleString()}\n\n`;
      });

      if (leaderboardData.length === 0) {
        leaderboardMsg = "No players have spun the wheel yet! Be the first! 🎡";
      }

      return api.sendMessage(leaderboardMsg, threadID, messageID);
    }

    // ========== JACKPOT COMMAND ==========
    if (command === 'jackpot') {
      const allUsers = await usersData.getAll();
      let totalJackpot = 0;
      allUsers.forEach(user => {
        totalJackpot += user.data?.progressiveJackpot || 0;
      });

      const jackpotMessage = `
🎰 ━━━━━━━ PROGRESSIVE JACKPOT ━━━━━━ 🎰

🏆 CURRENT JACKPOT: ${totalJackpot.toLocaleString()}
💰 MINIMUM WIN: ${(totalJackpot * 0.5).toLocaleString()}
💎 MAXIMUM WIN: ${(totalJackpot * 2).toLocaleString()}

━━━━━━ HOW TO WIN ━━━━━━
• Land on 🏆 JACKPOT segment
• Win the entire progressive pool
• Jackpot resets after win
• 1% of every bet contributes

🎯 Next Spin Could Be Yours!
      `.trim();

      return api.sendMessage(jackpotMessage, threadID, messageID);
    }

    // ========== SPIN COMMAND ==========
    if (!args[0]) {
      return api.sendMessage(
        `🎡 WHEEL OF FORTUNE\n\n` +
        `Usage: ${commandName} <bet amount>\n` +
        `Minimum: ${MIN_BET.toLocaleString()}\n` +
        `Maximum: ${MAX_BET.toLocaleString()}\n\n` +
        `Other commands:\n` +
        `• ${commandName} info\n` +
        `• ${commandName} stats\n` +
        `• ${commandName} leaderboard\n` +
        `• ${commandName} jackpot`,
        threadID, messageID
      );
    }

    const bet = parseInt(args[0].replace(/\D/g, ''));
    if (isNaN(bet) || bet < MIN_BET) {
      return api.sendMessage(`❌ Minimum bet is ${MIN_BET.toLocaleString()} coins.`, threadID, messageID);
    }

    if (bet > MAX_BET) {
      return api.sendMessage(`❌ Maximum bet is ${MAX_BET.toLocaleString()} coins.`, threadID, messageID);
    }

    // Load user data
    const user = await usersData.get(senderID);
    const now = Date.now();

    // Initialize wheel stats if not exists
    const wheelStats = user.data?.wheelStats || {
      totalSpins: 0,
      totalWon: 0,
      totalWagered: 0,
      biggestWin: 0,
      currentStreak: 0,
      highestStreak: 0,
      jackpotsWon: 0,
      lastSpins: []
    };

    // Check spin limits
    const validSpins = wheelStats.lastSpins.filter(time => 
      now - time < LIMIT_INTERVAL_HOURS * 3600 * 1000
    );

    if (validSpins.length >= MAX_PLAYS) {
      const nextSpinTime = new Date(validSpins[0] + LIMIT_INTERVAL_HOURS * 3600 * 1000);
      return api.sendMessage(
        `⏰ SPIN LIMIT REACHED!\n\n` +
        `You've used ${MAX_PLAYS} spins in ${LIMIT_INTERVAL_HOURS} hours.\n` +
        `Next spin available: ${nextSpinTime.toLocaleTimeString()}\n` +
        `Use "${commandName} stats" to check your usage.`,
        threadID, messageID
      );
    }

    // Check balance
    if (user.money < bet) {
      const needed = bet - user.money;
      return api.sendMessage(
        `💸 INSUFFICIENT FUNDS!\n\n` +
        `Current Balance: ${user.money.toLocaleString()}\n` +
        `Bet Amount: ${bet.toLocaleString()}\n` +
        `Needed: ${needed.toLocaleString()} more coins`,
        threadID, messageID
      );
    }

    // Deduct bet
    await usersData.set(senderID, {
      money: user.money - bet,
      "data.wheelStats.totalWagered": (wheelStats.totalWagered || 0) + bet
    });

    // Update spin tracking
    validSpins.push(now);

    // Progressive jackpot contribution (2%)
    const jackpotContribution = Math.floor(bet * 0.02);
    const currentJackpot = (user.data?.progressiveJackpot || 0) + jackpotContribution;

    await usersData.set(senderID, {
      "data.progressiveJackpot": currentJackpot,
      "data.wheelStats.lastSpins": validSpins.slice(-MAX_PLAYS),
      "data.wheelStats.totalSpins": wheelStats.totalSpins + 1
    });

    // ========== SPIN ANIMATION ==========
    let spinMessage;
    try {
      spinMessage = await api.sendMessage("🎡 Initializing Premium Wheel...", threadID);
    } catch (e) {
      console.error("Failed to send initial message:", e);
      return;
    }

    // Enhanced spinning animation
    const spinEmojis = ["🎡", "🌀", "⚡", "🌟"];
    const spinMessages = [
      "Spinning the wheel...",
      "Wheel gaining speed...",
      "Almost there...",
      "Determining your fate..."
    ];

    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      try {
        const emoji = spinEmojis[i % spinEmojis.length];
        const msg = spinMessages[Math.floor(i / 1) % spinMessages.length];
        await api.editMessage(`${emoji} ${msg}`, spinMessage.messageID);
      } catch (e) {
        console.error("Animation error:", e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ========== DETERMINE RESULT ==========
    const random = Math.random();
    let cumulativeProb = 0;
    let result;

    for (const segment of WHEEL_SEGMENTS) {
      cumulativeProb += segment.probability;
      if (random < cumulativeProb) {
        result = { ...segment };
        break;
      }
    }

    // Check for special event
    let specialEvent = null;
    for (const event of SPECIAL_EVENTS) {
      if (Math.random() < event.trigger) {
        specialEvent = event;
        result.multiplier = event.effect(result.multiplier);
        result.label += ` ✨ ${event.name}`;
        break;
      }
    }

    // Calculate base winnings
    let baseWinnings = Math.floor(bet * result.multiplier);
    let jackpotWin = 0;
    let specialBonus = 0;

    // Jackpot win
    if (result.type === "jackpot") {
      jackpotWin = currentJackpot * (0.5 + Math.random()); // 50-150% of jackpot
      jackpotWin = Math.floor(jackpotWin);
      await usersData.set(senderID, {
        "data.progressiveJackpot": 0,
        "data.wheelStats.jackpotsWon": (wheelStats.jackpotsWon || 0) + 1
      });
    }

    // Bankrupt fee
    if (result.type === "bankrupt") {
      const fee = Math.floor(bet * result.fee);
      baseWinnings = -fee;
    }

    // Streak bonus
    let newStreak = result.multiplier > 1 ? wheelStats.currentStreak + 1 : 0;
    if (newStreak >= 3) {
      specialBonus = Math.floor(bet * (newStreak - 2) * 0.25);
    }

    // Update highest streak
    const highestStreak = Math.max(wheelStats.highestStreak || 0, newStreak);

    // Calculate total winnings
    const totalWinnings = Math.max(0, baseWinnings) + jackpotWin + specialBonus;
    const finalBalance = user.money - bet + totalWinnings;

    // Update user data
    const updatedStats = {
      totalSpins: wheelStats.totalSpins + 1,
      totalWon: (wheelStats.totalWon || 0) + totalWinnings,
      totalWagered: (wheelStats.totalWagered || 0) + bet,
      biggestWin: Math.max(wheelStats.biggestWin || 0, totalWinnings),
      currentStreak: newStreak,
      highestStreak: highestStreak,
      lastSpins: [...validSpins.slice(-5), {
        time: now,
        bet: bet,
        result: result.label,
        winnings: totalWinnings
      }]
    };

    if (result.type === "jackpot") {
      updatedStats.jackpotsWon = (wheelStats.jackpotsWon || 0) + 1;
    }

    await usersData.set(senderID, {
      money: finalBalance,
      "data.wheelStats": updatedStats
    });

    // ========== RESULT MESSAGE ==========
    const resultLines = [
      `🎡 ━━━━━━━ WHEEL RESULT ━━━━━━ 🎡`,
      ``,
      `🎯 SEGMENT: ${result.emoji} ${result.label}`,
      `💰 BET AMOUNT: ${bet.toLocaleString()}`,
      `📈 MULTIPLIER: ${result.multiplier.toFixed(2)}x`,
      `━━━━━━━━━━━━━━━━━━━━`
    ];

    if (baseWinnings > 0) {
      resultLines.push(`🎉 BASE WINNINGS: +${baseWinnings.toLocaleString()}`);
    }

    if (jackpotWin > 0) {
      resultLines.push(`🏆 JACKPOT BONUS: +${jackpotWin.toLocaleString()}!`);
    }

    if (specialEvent) {
      resultLines.push(`✨ SPECIAL EVENT: ${specialEvent.name}!`);
    }

    if (specialBonus > 0) {
      resultLines.push(`🔥 STREAK BONUS (${newStreak}): +${specialBonus.toLocaleString()}`);
    }

    if (result.type === "bankrupt") {
      resultLines.push(`💸 BANKRUPT FEE: -${Math.floor(bet * result.fee).toLocaleString()}`);
    }

    resultLines.push(
      `━━━━━━━━━━━━━━━━━━━━`,
      `💵 TOTAL WINNINGS: ${totalWinnings > 0 ? '+' : ''}${totalWinnings.toLocaleString()}`,
      `💰 NEW BALANCE: ${finalBalance.toLocaleString()}`,
      `🎡 SPINS LEFT: ${MAX_PLAYS - validSpins.length}/${MAX_PLAYS}`,
      newStreak > 1 ? `🔥 WIN STREAK: ${newStreak}` : ''
    );

    // Send result
    try {
      await api.editMessage(resultLines.join('\n'), spinMessage.messageID);

      // Special celebration messages
      if (result.type === "jackpot") {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await api.sendMessage(
          `🎊 🎊 🎊 MASSIVE JACKPOT WIN! 🎊 🎊 🎊\n` +
          `Congratulations! You won ${jackpotWin.toLocaleString()} coins!`,
          threadID
        );
      } else if (totalWinnings > bet * 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await api.sendMessage("🎉 INCREDIBLE WIN! THE WHEEL FAVORS YOU! 🎉", threadID);
      }
    } catch (e) {
      console.error("Failed to edit message:", e);
      await api.sendMessage(resultLines.join('\n'), threadID);
    }
  }
};
