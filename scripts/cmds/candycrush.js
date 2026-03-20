module.exports = {
  config: {
    name: "candycrush",
    aliases: ["cc"],
    version: "3.2",
    author: "NC-AZAD • nc-nil",
    role: 0,
    countDown: 3,
    shortDescription: "🍬 Candy Crush Game",
    longDescription: "Candy Crush with bet & direction reply",
    category: "game",
    guide: {
      en:
        "{pn} <bet>\n" +
        "{pn} top\n" +
        "Reply: E3 U / D / L / R"
    }
  },

  // ================= START =================
  ncStart: async function ({ event, message, api, args, usersData }) {

    // ===== TOP =====
    if (args[0] === "top") {
      const top = await getTopPlayers(api, usersData);
      if (!top.length)
        return message.reply("⚡ No players yet!");

      let msg = "🏆 CANDY CRUSH TOP 5 🏆\n\n";
      top.forEach((p, i) => {
        msg += `${i + 1}. ${p.username} — 🍬 ${p.coins}\n`;
      });
      return message.reply(msg);
    }

    // ===== BET =====
    const bet = Number(args[0]);
    if (!bet || bet <= 0)
      return message.reply("❌ Use: -cc <bet>");

    const user = await usersData.get(event.senderID);
    if ((user?.money || 0) < bet)
      return message.reply("❌ Not enough balance!");

    const board = generateBoard();

    global.noobCoreCandy ??= {};
    global.noobCore.ncReply ??= new Map();

    global.noobCoreCandy[event.threadID] = {
      board,
      initiator: event.senderID,
      lastTime: Date.now(),
      messageID: null,
      bet,
      totalCoins: 0,
      combos: 0
    };

    const sent = await message.reply(
      displayBoard(board) +
      `\n💰 Bet: ${bet}\n\nReply with move:\nE3 U / D / L / R`
    );

    // ⭐ VERY IMPORTANT
    global.noobCore.ncReply.set(sent.messageID, {
      commandName: this.config.name, // 🔥 FIX
      author: event.senderID,
      threadID: event.threadID
    });

    global.noobCoreCandy[event.threadID].messageID = sent.messageID;

    startInactivityTimer(api, event.threadID);
  },

  // ================= REPLY =================
  ncReply: async function ({ event, message, api, usersData }) {
    if (!event.messageReply) return;

    const replyData = global.noobCore.ncReply?.get(
      event.messageReply.messageID
    );
    if (!replyData) return;
    if (replyData.author !== event.senderID) return;

    const game = global.noobCoreCandy?.[event.threadID];
    if (!game) return;

    game.lastTime = Date.now();

    // ===== PARSE =====
    const parts = event.body.trim().toUpperCase().split(/\s+/);
    if (parts.length !== 2)
      return endGame(api, event.threadID, message, usersData);

    const pos = parts[0];
    const dir = parts[1];

    if (!/^[A-E][1-5]$/.test(pos))
      return endGame(api, event.threadID, message, usersData);

    let [r1, c1] = getPos(pos);
    let r2 = r1, c2 = c1;

    if (dir === "U") r2--;
    else if (dir === "D") r2++;
    else if (dir === "L") c2--;
    else if (dir === "R") c2++;
    else return endGame(api, event.threadID, message, usersData);

    if (r2 < 0 || r2 > 4 || c2 < 0 || c2 > 4)
      return endGame(api, event.threadID, message, usersData);

    swap(game.board, r1, c1, r2, c2);

    let reward = 0;
    let combo = 0;

    while (true) {
      const matches = findMatches(game.board);
      if (!matches.length) break;

      combo++;
      game.combos++;

      const r = matches.length * 100 * combo;
      reward += r;

      removeMatches(game.board, matches);
      dropCandies(game.board);
    }

    if (!reward)
      return endGame(api, event.threadID, message, usersData);

    game.totalCoins += reward;
    await addCoins(event.senderID, reward, usersData);

    const sent = await message.reply(
      displayBoard(game.board) +
      `\n🔥 Combo x${combo}\n💰 +${reward}\n\nReply next move`
    );

    // 🔄 UPDATE REPLY TARGET
    global.noobCore.ncReply.delete(event.messageReply.messageID);
    global.noobCore.ncReply.set(sent.messageID, {
      commandName: this.config.name, // 🔥 FIX
      author: event.senderID,
      threadID: event.threadID
    });

    api.unsendMessage(game.messageID);
    game.messageID = sent.messageID;
  }
};

// ================= BOARD =================

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

// ================= MATCH =================

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

// ================= USERS =================

async function addCoins(uid, coins, usersData) {
  const d = await usersData.get(uid);
  await usersData.set(uid, { money: (d?.money || 0) + coins });
}

async function removeCoins(uid, coins, usersData) {
  const d = await usersData.get(uid);
  await usersData.set(uid, {
    money: Math.max(0, (d?.money || 0) - coins)
  });
}

async function getTopPlayers(api, usersData) {
  const all = await usersData.getAll();
  const top = all.sort((a,b)=>(b.money||0)-(a.money||0)).slice(0,5);

  const res=[];
  for(const u of top){
    const info = await new Promise(r =>
      api.getUserInfo(u.userID,(e,d)=>r(d?.[u.userID]))
    );
    if(info) res.push({ username: info.name, coins: u.money });
  }
  return res;
}

// ================= END =================

function endGame(api, tid, message, usersData) {
  const g = global.noobCoreCandy?.[tid];
  if (!g) return;

  removeCoins(g.initiator, g.bet, usersData);

  message.reply(
    `🏁 GAME OVER\n\n🔥 Combos: ${g.combos}\n💰 Earned: ${g.totalCoins}\n🎲 Bet: ${g.bet}`
  );

  setTimeout(() => {
    api.unsendMessage(g.messageID);
    delete global.noobCoreCandy[tid];
  }, 60000);
}

function startInactivityTimer(api, tid) {
  setTimeout(() => {
    const g = global.noobCoreCandy?.[tid];
    if (!g) return;
    if (Date.now() - g.lastTime >= 60000)
      endGame(api, tid, { reply: ()=>{} }, null);
  }, 60000);
}
