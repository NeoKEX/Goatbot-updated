module.exports = {
  config: {
    name: "candycrush",
    aliases: ["cc"],
    version: "1.0",
    author: "Converted by ChatGPT",
    countDown: 3,
    role: 0,
    shortDescription: "Candy Crush Game",
    longDescription: "Reply-based candy crush game with bet",
    category: "game",
    guide: "{pn} <bet> | {pn} top"
  },

  // ================= START =================
  onStart: async function ({ message, event, args, usersData, commandName }) {

    // ===== TOP =====
    if (args[0] === "top") {
      const all = await usersData.getAll();
      const top = all.sort((a,b)=>(b.money||0)-(a.money||0)).slice(0,5);

      let msg = "🏆 CANDY CRUSH TOP 5 🏆\n\n";
      for (let i = 0; i < top.length; i++) {
        msg += `${i+1}. ${top[i].name || "Player"} — 🍬 ${top[i].money || 0}\n`;
      }

      return message.reply(msg);
    }

    // ===== BET =====
    const bet = Number(args[0]);
    if (!bet || bet <= 0)
      return message.reply("❌ Use: cc <bet>");

    const user = await usersData.get(event.senderID);
    if ((user?.money || 0) < bet)
      return message.reply("❌ Not enough balance!");

    const board = generateBoard();

    const reply = await message.reply(
      displayBoard(board) +
      `\n💰 Bet: ${bet}\n\nReply: E3 U / D / L / R`
    );

    global.candyGame = global.candyGame || {};

    global.GoatBot.onReply.set(reply.messageID, {
      commandName,
      author: event.senderID,
      threadID: event.threadID,
      board,
      bet,
      totalCoins: 0,
      combos: 0,
      lastTime: Date.now()
    });
  },

  // ================= REPLY =================
  onReply: async function ({ message, event, Reply, usersData }) {
    const { author, board } = Reply;
    if (event.senderID !== author) return;

    Reply.lastTime = Date.now();

    const parts = event.body.trim().toUpperCase().split(/\s+/);
    if (parts.length !== 2) return endGame(message, Reply, usersData);

    const pos = parts[0];
    const dir = parts[1];

    if (!/^[A-E][1-5]$/.test(pos))
      return endGame(message, Reply, usersData);

    let [r1, c1] = getPos(pos);
    let r2 = r1, c2 = c1;

    if (dir === "U") r2--;
    else if (dir === "D") r2++;
    else if (dir === "L") c2--;
    else if (dir === "R") c2++;
    else return endGame(message, Reply, usersData);

    if (r2 < 0 || r2 > 4 || c2 < 0 || c2 > 4)
      return endGame(message, Reply, usersData);

    swap(board, r1, c1, r2, c2);

    let reward = 0;
    let combo = 0;

    while (true) {
      const matches = findMatches(board);
      if (!matches.length) break;

      combo++;
      Reply.combos++;

      const r = matches.length * 100 * combo;
      reward += r;

      removeMatches(board, matches);
      dropCandies(board);
    }

    if (!reward) return endGame(message, Reply, usersData);

    Reply.totalCoins += reward;

    const user = await usersData.get(event.senderID);
    await usersData.set(event.senderID, {
      money: (user.money || 0) + reward,
      exp: user.exp,
      data: user.data
    });

    global.GoatBot.onReply.delete(event.messageID);

    const newReply = await message.reply(
      displayBoard(board) +
      `\n🔥 Combo x${combo}\n💰 +${reward}\n\nReply next move`
    );

    global.GoatBot.onReply.set(newReply.messageID, Reply);
  }
};

// ================= GAME LOGIC =================

const ROWS = ["A","B","C","D","E"];
const CANDIES = ["🍫","🍬","🍪","🍩","🍉","🍭","🍒","🍓"];

function generateBoard() {
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () =>
      CANDIES[Math.floor(Math.random() * CANDIES.length)]
    )
  );
}

function displayBoard(board) {
  let out = "🍬 CANDY CRUSH 🍬\n\n";
  board.forEach((row, i) => {
    out += `${ROWS[i]} | ${row.join(" ")}  ${i + 1}\n`;
  });
  return out;
}

function getPos(t) {
  return [t.charCodeAt(0) - 65, Number(t[1]) - 1];
}

function swap(b, r1, c1, r2, c2) {
  [b[r1][c1], b[r2][c2]] = [b[r2][c2], b[r1][c1]];
}

function findMatches(b) {
  const m = [];
  for (let r=0;r<5;r++)
    for (let c=0;c<3;c++)
      if (b[r][c]===b[r][c+1] && b[r][c]===b[r][c+2])
        m.push([r,c],[r,c+1],[r,c+2]);

  for (let c=0;c<5;c++)
    for (let r=0;r<3;r++)
      if (b[r][c]===b[r+1][c] && b[r][c]===b[r+2][c])
        m.push([r,c],[r+1,c],[r+2,c]);

  return m;
}

function removeMatches(b,m){ m.forEach(([r,c])=>b[r][c]="⬜"); }

function dropCandies(b){
  for(let c=0;c<5;c++)
    for(let r=4;r>=0;r--)
      if(b[r][c]==="⬜")
        b[r][c]=CANDIES[Math.floor(Math.random()*CANDIES.length)];
}

// ================= END =================

function endGame(message, Reply, usersData) {
  message.reply(
    `🏁 GAME OVER\n\n🔥 Combos: ${Reply.combos}\n💰 Earned: ${Reply.totalCoins}\n🎲 Bet: ${Reply.bet}`
  );

  global.GoatBot.onReply.delete(message.messageID);
}
