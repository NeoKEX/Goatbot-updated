const axios = require("axios");

module.exports = {
  config: {
    name: "sudoku",
    aliases: ["sd"],
    version: "1.0",
    author: "Zaevii",
    countDown: 5,
    role: 0,
    guide: { en: "{pn} — Start a Sudoku game and solve the puzzle!" }
  },

  ncStart: async function ({ api, event, usersData }) {
    try {
      // Fetch a Sudoku puzzle
      const { data } = await axios.get("https://sugoku.herokuapp.com/board?difficulty=easy");
      const puzzle = data.board;

      // Format puzzle for display
      let display = "╭──❖  SUDOKU  ❖──╮\n";
      puzzle.forEach((row, i) => {
        display += row.map(n => (n === 0 ? "⬜" : n)).join(" ") + "\n";
      });
      display += "╰────────────────╯\nReply with your answer as row,col,value (e.g., 1,3,5)";

      // Save game state in global cache
      global.noobCore.ncReply.set(event.messageID, {
        commandName: this.config.name,
        type: "sudoku",
        puzzle,
        author: event.senderID,
        attempts: 0,
        maxAttempts: 3
      });

      return api.sendMessage(display, event.threadID, event.messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to load Sudoku puzzle!", event.threadID, event.messageID);
    }
  },

  ncReply: async function ({ api, event, Reply, usersData }) {
    const game = Reply;
    if (event.senderID !== game.author)
      return api.sendMessage("⚠️ This Sudoku game is not yours!", event.threadID, event.messageID);

    const answer = event.body?.trim().split(",").map(x => parseInt(x));
    if (!answer || answer.length !== 3 || answer.some(isNaN))
      return api.sendMessage("❌ Invalid format! Use row,col,value (e.g., 1,3,5)", event.threadID, event.messageID);

    const [row, col, value] = answer.map(n => n - 1); // 0-indexed
    if (game.puzzle[row][col] !== 0)
      return api.sendMessage("❌ That cell is already filled!", event.threadID, event.messageID);

    // Simple check using solved API
    game.puzzle[row][col] = value + 1; // set temporarily
    try {
      const { data } = await axios.post("https://sugoku.herokuapp.com/validate", `board=${encodeURIComponent(JSON.stringify(game.puzzle))}`, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      game.attempts += 1;

      if (data.status === "solved") {
        // Give reward
        const rewardCoin = 200;
        const rewardExp = 50;
        const userData = await usersData.get(event.senderID);
        userData.money += rewardCoin;
        userData.exp += rewardExp;
        await usersData.set(event.senderID, userData);

        global.noobCore.ncReply.delete(event.messageID);
        return api.sendMessage(
          `✅ Congratulations! Sudoku solved!\n💰 +${rewardCoin} Coin\n✨ +${rewardExp} EXP`,
          event.threadID,
          event.messageID
        );
      } else {
        if (game.attempts >= game.maxAttempts) {
          global.noobCore.ncReply.delete(event.messageID);
          return api.sendMessage("😢 Max attempts reached! Game over.", event.threadID, event.messageID);
        } else {
          global.noobCore.ncReply.set(event.messageID, game);
          return api.sendMessage(`❌ Wrong move! Attempts left: ${game.maxAttempts - game.attempts}`, event.threadID, event.messageID);
        }
      }
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error checking Sudoku move!", event.threadID, event.messageID);
    }
  }
};
