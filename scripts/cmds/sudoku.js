const fs = require("fs");
const { shuffle } = require("lodash"); // optional, can implement shuffle manually

module.exports = {
  config: {
    name: "sudoku",
    aliases: ["sudoko", "sd"],
    version: "1.0",
    author: "ChatGPT",
    role: 0,
    shortDescription: "🧩 Play Sudoku",
    longDescription: "Generate and play a Sudoku puzzle directly in chat",
    category: "game",
    guide: "{pn} sudoku — start a new game\n{pn} sudoku <row><col> <number> — fill a cell"
  },

  onStart: async ({ event, message, usersData }) => {
    const userID = event.senderID;
    const args = event.body?.split(/\s+/).slice(1);

    // Load or initialize user's game
    const tmpFile = `./sudoku_${userID}.json`;
    let game = fs.existsSync(tmpFile) ? JSON.parse(fs.readFileSync(tmpFile)) : null;

    if (!args.length) {
      // Start a new game
      game = generateSudoku(30); // 30 numbers prefilled
      fs.writeFileSync(tmpFile, JSON.stringify(game));
      return message.reply("🧩 New Sudoku game started!\n" + displaySudoku(game.board, game.prefilled));
    }

    // Play: fill a cell
    if (!game) return message.reply("❌ No active game. Start a new one with {pn} sudoku".replace("{pn}", event.prefix));

    const [cell, value] = args;
    if (!/^[1-9][1-9]$/.test(cell) || !/^[1-9]$/.test(value)) {
      return message.reply("❌ Invalid input. Use format: rowcol number (e.g., 12 5)");
    }

    const row = Number(cell[0]) - 1;
    const col = Number(cell[1]) - 1;
    const num = Number(value);

    if (game.prefilled[row][col]) {
      return message.reply("❌ This cell is prefilled and cannot be changed.");
    }

    // Fill the cell
    game.board[row][col] = num;
    fs.writeFileSync(tmpFile, JSON.stringify(game));

    // Check if puzzle solved
    if (checkSolved(game.board)) {
      fs.unlinkSync(tmpFile);
      return message.reply("🎉 Congratulations! You solved the Sudoku!");
    }

    return message.reply("🧩 Sudoku updated:\n" + displaySudoku(game.board, game.prefilled));
  }
};

/* ===== Helper functions ===== */

// Generate a Sudoku puzzle
function generateSudoku(prefill = 30) {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  const prefilled = Array.from({ length: 9 }, () => Array(9).fill(false));

  fillSudoku(board);

  // Remove numbers to create puzzle
  let removed = 81 - prefill;
  while (removed > 0) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (board[r][c] !== 0) {
      board[r][c] = 0;
      removed--;
    }
  }

  // Track prefilled cells
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      prefilled[i][j] = board[i][j] !== 0;
    }
  }

  return { board, prefilled };
}

// Simple backtracking solver
function fillSudoku(board) {
  const empty = findEmpty(board);
  if (!empty) return true;

  const [row, col] = empty;
  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (const n of nums) {
    if (valid(board, row, col, n)) {
      board[row][col] = n;
      if (fillSudoku(board)) return true;
      board[row][col] = 0;
    }
  }
  return false;
}

function findEmpty(board) {
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      if (board[i][j] === 0) return [i, j];
  return null;
}

function valid(board, row, col, num) {
  // Row/column
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  // Box
  const startRow = Math.floor(row/3)*3;
  const startCol = Math.floor(col/3)*3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[startRow+i][startCol+j] === num) return false;
  return true;
}

// Display Sudoku nicely
function displaySudoku(board, prefilled) {
  return board.map((row, i) =>
    row.map((cell, j) => cell || "⬜").join(" ")
  ).join("\n");
}

// Check if solved
function checkSolved(board) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0 || !valid(board, r, c, board[r][c])) return false;
  return true;
}

// Optional lodash shuffle if not installed
function shuffle(arr) {
  for (let i = arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
