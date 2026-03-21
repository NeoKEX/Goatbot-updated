module.exports = {
  config: {
    name: "sudoku",
    aliases: ["sud"],
    version: "1.0",
    author: "Zaevii",
    countDown: 5,
    adminOnly: false,
    description: "Play Sudoku directly in chat",
    category: "game", // REQUIRED for GoatBot
    guide: "{pn}sudoku - Start a new Sudoku game",
    usePrefix: true
  },

  ncStart: async function({ message, event, args }) {
    // Simple Sudoku placeholder
    const sudokuBoard = `
🟦 Sudoku Board 🟦

5 3 _ | _ 7 _ | _ _ _
6 _ _ | 1 9 5 | _ _ _
_ 9 8 | _ _ _ | _ 6 _ 
------+-------+------
8 _ _ | _ 6 _ | _ _ 3
4 _ _ | 8 _ 3 | _ _ 1
7 _ _ | _ 2 _ | _ _ 6
------+-------+------
_ 6 _ | _ _ _ | 2 8 _
_ _ _ | 4 1 9 | _ _ 5
_ _ _ | _ 8 _ | _ 7 9
`;

    await message.reply(
      "🧩 Starting a Sudoku game!\n" + sudokuBoard +
      "\nReply with your moves in format: row,column,value\nExample: 1,3,4"
    );

    // You can store game state in global or a simple Map if you want multi-user games
    global.sudokuGames = global.sudokuGames || {};
    global.sudokuGames[event.threadID] = {
      board: sudokuBoard,
      player: event.senderID
    };
  },

  ncReply: async function({ message, Reply, event }) {
    // Check if a Sudoku game exists for this thread
    if (!global.sudokuGames || !global.sudokuGames[event.threadID]) {
      return message.reply("⚠️ No active Sudoku game in this chat. Start one with {pn}sudoku");
    }

    const game = global.sudokuGames[event.threadID];

    // Parse user input
    const move = event.body.trim().split(",");
    if (move.length !== 3) {
      return message.reply("⚠️ Invalid format! Use row,column,value e.g., 1,3,4");
    }

    const [row, col, value] = move.map(Number);
    if ([row, col, value].some(n => isNaN(n) || n < 1 || n > 9)) {
      return message.reply("⚠️ Numbers must be between 1 and 9");
    }

    // Placeholder logic (just acknowledge the move)
    await message.reply(`✅ Move registered: row ${row}, column ${col}, value ${value}\n(Full Sudoku logic not implemented yet)`);

    // Here you could update `game.board` and check for completion
  }
};
