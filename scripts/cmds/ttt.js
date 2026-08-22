const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

let games = {};

function renderBoard(board, playerXName, playerOName) {
  const canvas = createCanvas(400, 460);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, 400, 460);

  // Title bar
  ctx.fillStyle = "#00ffff";
  ctx.fillRect(0, 0, 400, 60);
  ctx.fillStyle = "#000";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${playerXName} (X) 🆚 ${playerOName} (O)`, 200, 35);

  // Grid lines
  ctx.strokeStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 15;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(133, 70); ctx.lineTo(133, 430);
  ctx.moveTo(266, 70); ctx.lineTo(266, 430);
  ctx.moveTo(0, 170); ctx.lineTo(400, 170);
  ctx.moveTo(0, 300); ctx.lineTo(400, 300);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Draw symbols and numbers
  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 9; i++) {
    const centerX = (i % 3) * 133 + 67;
    const centerY = Math.floor(i / 3) * 130 + 120;

    if (board[i] === "X") {
      ctx.fillStyle = "#ff0000";
      ctx.shadowColor = "#cc0000";
      ctx.shadowBlur = 20;
      ctx.fillText("X", centerX, centerY);
      ctx.shadowBlur = 0;
    } else if (board[i] === "O") {
      ctx.fillStyle = "#ff8800";
      ctx.shadowColor = "#ff5500";
      ctx.shadowBlur = 20;
      ctx.fillText("O", centerX, centerY);
      ctx.shadowBlur = 0;
    } else {
      // Show small corner number if the cell is empty
      ctx.fillStyle = "#00ffff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      const cornerX = (i % 3) * 133 + 125; // right corner of cell
      const cornerY = Math.floor(i / 3) * 130 + 75; // top corner
      ctx.fillText((i + 1).toString(), cornerX, cornerY);

      // Reset font for symbols
      ctx.font = "bold 80px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
  }

  return canvas.toBuffer();
}

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let line of wins) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every(cell => cell)) return "draw";
  return null;
}

// Timer
function resetTimer(gameId, message) {
  const game = games[gameId];
  if (!game) return;

  if (game.timeout) clearTimeout(game.timeout);

  game.timeout = setTimeout(() => {
    delete games[gameId];
    message.reply("⏰ Time is up! Game cancelled.");
  }, 60000);
}

module.exports = {
  config: {
    name: "ttt",
    aliases: ["tic-tac-toe"],
    version: "3.7",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    shortDescription: "Play tic tac toe",
    longDescription: "Play a neon tic tac toe game with red X, orange O, and corner numbers",
    category: "game",
    guide: {
      en: "/ttt @mention → start game\nThen reply with 1-9"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    const mentions = Object.keys(event.mentions);
    if (mentions.length === 0) {
      return message.reply("❌ Please mention someone to start the game!");
    }

    const playerX = event.senderID;
    const playerO = mentions[0];

    const playerXName = await usersData.getName(playerX);
    const playerOName = await usersData.getName(playerO);

    const gameId = `${event.threadID}`;
    if (games[gameId]) {
      return message.reply("⚠️ A game is already running in this group!");
    }

    games[gameId] = {
      board: Array(9).fill(null),
      players: { X: playerX, O: playerO },
      names: { X: playerXName, O: playerOName },
      turn: "X",
      timeout: null
    };

    resetTimer(gameId, message);

    const img = renderBoard(games[gameId].board, playerXName, playerOName);
    const filePath = path.join(__dirname, "ttt.png");
    fs.writeFileSync(filePath, img);

    message.reply({
      body: `🎮 Tic Tac Toe Started!\n\n👉 ${playerXName} = X (Red)\n👉 ${playerOName} = O (Orange)\n\nFirst turn: X`,
      attachment: fs.createReadStream(filePath)
    });
  },

  onChat: async function ({ message, event }) {
    const gameId = `${event.threadID}`;
    const game = games[gameId];
    if (!game) return;

    const move = parseInt(event.body);
    if (isNaN(move) || move < 1 || move > 9) return;

    const player = Object.keys(game.players).find(
      key => game.players[key] === event.senderID
    );

    if (!player) return;
    if (game.turn !== player) {
      return message.reply("⏳ It's not your turn!");
    }

    const index = move - 1;
    if (game.board[index]) {
      return message.reply("❌ This cell is already filled!");
    }

    game.board[index] = player;
    game.turn = game.turn === "X" ? "O" : "X";

    resetTimer(gameId, message);

    const winner = checkWinner(game.board);
    const img = renderBoard(game.board, game.names.X, game.names.O);
    const filePath = path.join(__dirname, "ttt.png");
    fs.writeFileSync(filePath, img);

    if (winner) {
      clearTimeout(game.timeout);
      delete games[gameId];

      if (winner === "draw") {
        return message.reply({
          body: "🤝 It's a draw!",
          attachment: fs.createReadStream(filePath)
        });
      } else {
        return message.reply({
          body: `🏆 Winner: ${game.names[winner]} (${winner})`,
          attachment: fs.createReadStream(filePath)
        });
      }
    } else {
      return message.reply({
        body: `👉 Now it's ${game.names[game.turn]}'s (${game.turn}) turn`,
        attachment: fs.createReadStream(filePath)
      });
    }
  }
};
