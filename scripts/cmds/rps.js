module.exports = {
 config: {
 name: "rps",
 version: "1.0",
 author: "Toshiro Editz",
 shortDescription: "Play rock-paper-scissors game with the bot.",
 category: "fun",
 guide: "{prefix}rps <rock|paper|scissors>"
 },
 onStart: async function ({ message, args }) {
 const choices = ["rock", "paper", "scissors"];
 const userChoice = args[0];
 if (!userChoice || !choices.includes(userChoice.toLowerCase())) {
 return message.reply("Please choose either rock, paper or scissors!");
 }

 const botChoice = choices[Math.floor(Math.random() * choices.length)];

 message.reply(`You chose ${userChoice}. I chose ${botChoice}.`);

 if (userChoice.toLowerCase() === botChoice) {
 message.reply("It's a tie!");
 } else if (
 (userChoice.toLowerCase() === "rock" && botChoice === "scissors") ||
 (userChoice.toLowerCase() === "paper" && botChoice === "rock") ||
 (userChoice.toLowerCase() === "scissors" && botChoice === "paper")
 ) {
 message.reply("Congratulations! You won!");
 } else {
 message.reply("I win! Better luck next time!");
 }
 },
};module.exports = {
 config: {
 name: "rps",
 version: "1.0",
 author: "Your name",
 shortDescription: "Play rock-paper-scissors game with the bot using emoji.",
 category: "fun",
 guide: "{prefix}rps <✊|✋|✌️>"
 },
 onStart: async function ({ message, args }) {
 const choices = ["✊", "✋", "✌️"];
 const userChoice = args[0];
 if (!userChoice || !choices.includes(userChoice)) {
 return message.reply("Please choose either ✊, ✋, or ✌️!");
 }

 const botChoice = choices[Math.floor(Math.random() * choices.length)];

 message.reply(`You chose ${userChoice}. I chose ${botChoice}.`);

 if (userChoice === botChoice) {
 message.reply("It's a tie! ⚖️");
 } else if (
 (userChoice === "✊" && botChoice === "✌️") ||
 (userChoice === "✋" && botChoice === "✊") ||
 (userChoice === "✌️" && botChoice === "✋")
 ) {
 message.reply("╔════ஜ۩۞۩ஜ════╗\n\nCongratulations! You won! 🎉\n\n╚════ஜ۩۞۩ஜ════╝");
 } else {
 message.reply("╔════ஜ۩۞۩ஜ═══╗\n\nI win! Better luck next time! 😎\n\n╚════ஜ۩۞۩ஜ═══╝");
 }
 },
};