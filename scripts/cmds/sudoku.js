const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "sudoku",
  version: "1.0",
  author: "Zaevii",
  countDown: 5,
  adminOnly: false,
  description: "Play Sudoku directly in chat",
  guide: "{pn}sudoku - Start a new Sudoku game",
  usePrefix: true
};

// Utility to generate a simple Sudoku board
function generateSudoku() {
  // 9x9 empty board
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  // Fill some random numbers for demo (simple, not full Sudoku generation)
  for (let i = 0; i < 20; i++) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    const num = Math.floor(Math.random() * 9) + 1;
    board[row][col] = num;
  }

  return board;
}

// Convert board to string for chat
function boardToString(board) {
  return board.map(row => row.map(n => (n === 0 ? "·" : n)).join(" ")).join("\n");
}

module.exports.onStart = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    const board = generateSudoku();
    const boardStr = boardToString(board);

    const msg = `🧩 Sudoku Game Started!\n\n${boardStr}\n\nReply with your moves in format: row col number`;

    api.sendMessage(msg, threadID, messageID);
  } catch (err) {
    console.error("[Sudoku Command Error]", err.message);
    api.sendMessage(`⚠️ Error starting Sudoku: ${err.message}`, threadID, messageID);
  }
};
