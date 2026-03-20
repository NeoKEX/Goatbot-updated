const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

// File to store user balances
const BALANCE_FILE = path.join(__dirname, "sudoku_balances.json");

// Load balances or initialize
let balances = {};
if (fs.existsSync(BALANCE_FILE)) {
  balances = JSON.parse(fs.readFileSync(BALANCE_FILE, "utf8"));
}

function saveBalances() {
  fs.writeFileSync(BALANCE_FILE, JSON.stringify(balances, null, 2));
}

// Sudoku generation functions
function generateSudokuBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  const fillBoard = (b) => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (b[i][j] === 0) {
          const options = shuffle(nums).filter(
            (n) =>
              !b[i].includes(n) &&
              !b.map((r) => r[j]).includes(n) &&
              !b
                .slice(Math.floor(i / 3) * 3, Math.floor(i / 3) * 3 + 3)
                .flat()
                .slice(Math.floor(j / 3) * 3, Math.floor(j / 3) * 3 + 3)
                .includes(n)
          );
          if (options.length === 0) return false;
          b[i][j] = options[0];
          if (!fillBoard(b)) {
            b[i][j] = 0;
          }
        }
      }
    }
    return true;
  };

  fillBoard(board);

  // Remove some numbers for puzzle
  const removeCount = 40;
  for (let k = 0; k < removeCount; k++) {
    const i = Math.floor(Math.random() * 9);
    const j = Math.floor(Math.random() * 9);
    board[i][j] = 0;
  }

  return board;
}

function renderBoardImage(board) {
  const canvasSize = 450;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.strokeStyle = "#000000";
  for (let i = 0; i <= 9; i++) {
    ctx.lineWidth = i % 3 === 0 ? 3 : 1;
    ctx.beginPath();
    ctx.moveTo(0, (i * canvasSize) / 9);
    ctx.lineTo(canvasSize, (i * canvasSize) / 9);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((i * canvasSize) / 9, 0);
    ctx.lineTo((i * canvasSize) / 9, canvasSize);
    ctx.stroke();
  }

  ctx.fillStyle = "#000000";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] !== 0) {
        ctx.fillText(board[i][j], (j + 0.5) * (canvasSize / 9), (i + 0.5) * (canvasSize / 9));
      }
    }
  }

  return canvas.toBuffer();
}

module.exports = {
  config: {
    name: "sudoku",
    version: "1.1",
    author: "NC-YOURNAME",
    description: "🎮 Generate a Sudoku puzzle and earn fake money 💰",
    category: "fun",
    guide: "{pn} — Generate a Sudoku game and get rewards"
  },

  ncStart: async ({ api, event }) => {
    try {
      const board = generateSudokuBoard();
      const imgBuffer = renderBoardImage(board);

      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filePath = path.join(tmpDir, `sudoku_${Date.now()}.png`);
      fs.writeFileSync(filePath, imgBuffer);

      // Give a random reward
      const reward = Math.floor(Math.random() * 101) + 50; // 50 to 150
      if (!balances[event.senderID]) balances[event.senderID] = 0;
      balances[event.senderID] += reward;
      saveBalances();

      await api.sendMessage(
        {
          body: `🧩 Here’s your Sudoku puzzle!\n💰 You earned: ${reward} coins\n💵 Total: ${balances[event.senderID]} coins`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to generate Sudoku.", event.threadID, event.messageID);
    }
  }
};
