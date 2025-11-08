const fs = require("fs-extra");

let createCanvas, loadImage;
let canvasAvailable = false;
try {
        const canvas = require("canvas");
        createCanvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
        canvasAvailable = true;
        console.log("✅ [CASINO] Canvas loaded successfully - cards will be generated");
} catch (err) {
        console.log("❌ [CASINO] Canvas not available - using text only. Error:", err.message);
        canvasAvailable = false;
}

function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
}

async function createSlotsCard(reel1, reel2, reel3, isWin, winnings, bet, balance) {
        if (!canvasAvailable) {
                return null;
        }
        const canvas = createCanvas(1200, 800);
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
        gradient.addColorStop(0, "#0f0c29");
        gradient.addColorStop(0.5, "#302b63");
        gradient.addColorStop(1, "#24243e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 800);

        for (let i = 0; i < 30; i++) {
                const x = Math.random() * 1200;
                const y = Math.random() * 800;
                const radius = Math.random() * 100 + 50;
                const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                innerGradient.addColorStop(0, `rgba(138, 43, 226, ${Math.random() * 0.15})`);
                innerGradient.addColorStop(1, "rgba(138, 43, 226, 0)");
                ctx.fillStyle = innerGradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
        ctx.shadowBlur = 30;
        ctx.font = "bold 80px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "center";
        ctx.fillText("SLOT MACHINE", 600, 100);
        ctx.shadowBlur = 0;

        const slotWidth = 280;
        const slotHeight = 320;
        const spacing = 60;
        const startX = (1200 - (slotWidth * 3 + spacing * 2)) / 2;
        const startY = 200;

        const reels = [reel1, reel2, reel3];
        for (let i = 0; i < 3; i++) {
                const x = startX + i * (slotWidth + spacing);

                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowBlur = 20;
                roundRect(ctx, x, startY, slotWidth, slotHeight, 20);

                const slotGradient = ctx.createLinearGradient(x, startY, x, startY + slotHeight);
                slotGradient.addColorStop(0, "#2c3e50");
                slotGradient.addColorStop(1, "#34495e");
                ctx.fillStyle = slotGradient;
                ctx.fill();

                ctx.strokeStyle = "#FFD700";
                ctx.lineWidth = 5;
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.font = "180px Arial";
                ctx.fillStyle = "#FFFFFF";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                ctx.shadowBlur = 10;
                ctx.fillText(reels[i], x + slotWidth / 2, startY + slotHeight / 2 + 65);
                ctx.shadowBlur = 0;
        }

        ctx.font = "bold 56px Arial";
        ctx.textAlign = "center";
        if (isWin) {
                ctx.fillStyle = "#00FF00";
                ctx.shadowColor = "rgba(0, 255, 0, 0.5)";
                ctx.shadowBlur = 20;
                ctx.fillText(`YOU WON! +$${winnings.toLocaleString()}`, 600, 600);
        } else {
                ctx.fillStyle = "#FF4444";
                ctx.shadowColor = "rgba(255, 68, 68, 0.5)";
                ctx.shadowBlur = 20;
                ctx.fillText(`You lost $${bet.toLocaleString()}`, 600, 600);
        }
        ctx.shadowBlur = 0;

        ctx.font = "32px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`New Balance: $${balance.toLocaleString()}`, 600, 670);

        ctx.font = "20px Arial";
        ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
        ctx.fillText("Powered by NeoKEX", 600, 750);

        const buffer = canvas.toBuffer();
        const tempPath = `./tmp/slots_${Date.now()}.png`;
        await fs.outputFile(tempPath, buffer);
        return fs.createReadStream(tempPath);
}

async function createCoinflipCard(userChoice, result, isWin, winnings, bet, balance) {
        if (!canvasAvailable) {
                return null;
        }
        const canvas = createCanvas(1000, 700);
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(0, 0, 1000, 700);
        gradient.addColorStop(0, "#0f0c29");
        gradient.addColorStop(0.5, "#302b63");
        gradient.addColorStop(1, "#24243e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 700);

        for (let i = 0; i < 20; i++) {
                const x = Math.random() * 1000;
                const y = Math.random() * 700;
                const radius = Math.random() * 80 + 40;
                const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                innerGradient.addColorStop(0, `rgba(138, 43, 226, ${Math.random() * 0.15})`);
                innerGradient.addColorStop(1, "rgba(138, 43, 226, 0)");
                ctx.fillStyle = innerGradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.shadowColor = "rgba(255, 215, 0, 0.3)";
        ctx.shadowBlur = 30;
        ctx.font = "bold 70px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "center";
        ctx.fillText("$ COINFLIP $", 500, 80);
        ctx.shadowBlur = 0;

        const coinSize = 250;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 30;

        const coinGradient = ctx.createRadialGradient(500, 280, 0, 500, 280, coinSize / 2);
        coinGradient.addColorStop(0, "#FFE55C");
        coinGradient.addColorStop(0.5, "#FFD700");
        coinGradient.addColorStop(1, "#B8860B");
        ctx.fillStyle = coinGradient;
        ctx.beginPath();
        ctx.arc(500, 280, coinSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#8B7500";
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = "bold 80px Arial";
        ctx.fillStyle = "#654321";
        ctx.textAlign = "center";
        const displayResult = result.toUpperCase()[0];
        ctx.fillText(displayResult, 500, 310);

        ctx.font = "32px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`You chose: ${userChoice.toUpperCase()}`, 500, 470);
        ctx.fillText(`Result: ${result.toUpperCase()}`, 500, 520);

        ctx.font = "bold 48px Arial";
        if (isWin) {
                ctx.fillStyle = "#00FF00";
                ctx.shadowColor = "rgba(0, 255, 0, 0.5)";
                ctx.shadowBlur = 20;
                ctx.fillText(`WON $${winnings.toLocaleString()}!`, 500, 590);
        } else {
                ctx.fillStyle = "#FF4444";
                ctx.shadowColor = "rgba(255, 68, 68, 0.5)";
                ctx.shadowBlur = 20;
                ctx.fillText(`Lost $${bet.toLocaleString()}`, 500, 590);
        }
        ctx.shadowBlur = 0;

        ctx.font = "28px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`Balance: $${balance.toLocaleString()}`, 500, 650);

        ctx.font = "18px Arial";
        ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
        ctx.fillText("Powered by NeoKEX", 500, 690);

        const buffer = canvas.toBuffer();
        const tempPath = `./tmp/coinflip_${Date.now()}.png`;
        await fs.outputFile(tempPath, buffer);
        return fs.createReadStream(tempPath);
}

async function createRouletteCard(userBet, result, isWin, winnings, bet, balance) {
        if (!canvasAvailable) {
                return null;
        }
        const canvas = createCanvas(1000, 800);
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(0, 0, 1000, 800);
        gradient.addColorStop(0, "#0f0c29");
        gradient.addColorStop(0.5, "#302b63");
        gradient.addColorStop(1, "#24243e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 800);

        for (let i = 0; i < 25; i++) {
                const x = Math.random() * 1000;
                const y = Math.random() * 800;
                const radius = Math.random() * 90 + 50;
                const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                innerGradient.addColorStop(0, `rgba(138, 43, 226, ${Math.random() * 0.15})`);
                innerGradient.addColorStop(1, "rgba(138, 43, 226, 0)");
                ctx.fillStyle = innerGradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.font = "bold 70px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
        ctx.shadowBlur = 30;
        ctx.fillText("ROULETTE", 500, 80);
        ctx.shadowBlur = 0;

        const wheelRadius = 200;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 30;

        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(500, 300, wheelRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const segments = 18;
        for (let i = 0; i < segments; i++) {
                const startAngle = (i * 2 * Math.PI) / segments;
                const endAngle = ((i + 1) * 2 * Math.PI) / segments;

                ctx.beginPath();
                ctx.moveTo(500, 300);
                ctx.arc(500, 300, wheelRadius, startAngle, endAngle);
                ctx.closePath();

                if (i % 3 === 0) ctx.fillStyle = "#00AA00";
                else if (i % 2 === 0) ctx.fillStyle = "#CC0000";
                else ctx.fillStyle = "#000000";

                ctx.fill();
                ctx.strokeStyle = "#FFD700";
                ctx.lineWidth = 2;
                ctx.stroke();
        }

        const pointerGradient = ctx.createLinearGradient(500, 70, 500, 130);
        pointerGradient.addColorStop(0, "#FFD700");
        pointerGradient.addColorStop(1, "#FFA500");
        ctx.fillStyle = pointerGradient;
        ctx.beginPath();
        ctx.moveTo(500, 70);
        ctx.lineTo(480, 110);
        ctx.lineTo(520, 110);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#8B7500";
        ctx.lineWidth = 2;
        ctx.stroke();

        let resultColor;
        if (result === "green") resultColor = "#00FF00";
        else if (result === "red") resultColor = "#FF0000";
        else resultColor = "#000000";

        roundRect(ctx, 300, 510, 400, 80, 15);
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fill();

        ctx.font = "32px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`Your bet: ${userBet.toUpperCase()}`, 500, 560);

        roundRect(ctx, 300, 600, 400, 80, 15);
        ctx.fillStyle = resultColor;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.font = "bold 36px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`Result: ${result.toUpperCase()}`, 500, 650);

        ctx.font = "bold 42px Arial";
        if (isWin) {
                ctx.fillStyle = "#00FF00";
                ctx.shadowColor = "rgba(0, 255, 0, 0.5)";
                ctx.shadowBlur = 20;
                ctx.fillText(`WON $${winnings.toLocaleString()}!`, 500, 720);
        } else {
                ctx.fillStyle = "#FF4444";
                ctx.shadowColor = "rgba(255, 68, 68, 0.5)";
                ctx.shadowBlur = 20;
                ctx.fillText(`Lost $${bet.toLocaleString()}`, 500, 720);
        }
        ctx.shadowBlur = 0;

        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`Balance: $${balance.toLocaleString()}`, 500, 770);

        ctx.font = "18px Arial";
        ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
        ctx.textAlign = "center";
        ctx.fillText("Powered by NeoKEX", 500, 795);

        const buffer = canvas.toBuffer();
        const tempPath = `./tmp/roulette_${Date.now()}.png`;
        await fs.outputFile(tempPath, buffer);
        return fs.createReadStream(tempPath);
}

module.exports = {
        config: {
                name: "casino",
                aliases: ["slots", "blackjack", "roulette", "coinflip"],
                version: "3.0.0",
                author: "NeoKEX",
                countDown: 10,
                role: 0,
                description: {
                        en: "Casino games - Slots, Blackjack, Roulette, Coinflip"
                },
                category: "games",
                guide: {
                        en: "   {pn} slots <bet> - Play slot machine"
                                + "\n   {pn} coinflip <bet> <heads|tails> - Flip a coin"
                                + "\n   {pn} roulette <bet> <red|black|green> - Spin the roulette"
                                + "\n   {pn} blackjack <bet> - Play blackjack (coming soon)"
                }
        },

        langs: {
                en: {
                        invalidBet: "❌ Please enter a valid bet amount!",
                        insufficientMoney: "❌ You don't have enough money! Your balance: $%1",
                        slotsWin: "🎰 SLOT MACHINE 🎰\n\n%1\n\n🎉 JACKPOT! You won $%2!\n💰 New balance: $%3",
                        slotsLose: "🎰 SLOT MACHINE 🎰\n\n%1\n\n😢 You lost $%2!\n💰 New balance: $%3",
                        slotsBigWin: "🎰 SLOT MACHINE 🎰\n\n%1\n\n💎 BIG WIN! Triple match! You won $%2!\n💰 New balance: $%3",
                        coinflipWin: "🪙 COINFLIP 🪙\n\nYou chose: %1\nResult: %2\n\n🎉 You won $%3!\n💰 New balance: $%4",
                        coinflipLose: "🪙 COINFLIP 🪙\n\nYou chose: %1\nResult: %2\n\n😢 You lost $%3!\n💰 New balance: $%4",
                        invalidChoice: "❌ Please choose heads or tails!",
                        rouletteWin: "🎡 ROULETTE 🎡\n\nYou bet on: %1\nResult: %2\n\n🎉 You won $%3!\n💰 New balance: $%4",
                        rouletteLose: "🎡 ROULETTE 🎡\n\nYou bet on: %1\nResult: %2\n\n😢 You lost $%3!\n💰 New balance: $%4",
                        rouletteBigWin: "🎡 ROULETTE 🎡\n\nYou bet on: %1\nResult: %2\n\n💎 GREEN WIN! 35x payout! You won $%3!\n💰 New balance: $%4",
                        invalidColor: "❌ Please choose red, black, or green!",
                        minBet: "❌ Minimum bet is $10!"
                }
        },

        onStart: async function ({ args, message, event, usersData, getLang, commandName }) {
                const { senderID } = event;
                const userData = await usersData.get(senderID);

                const game = args[0]?.toLowerCase() || "help";
                const bet = parseInt(args[1]);

                if (bet && (isNaN(bet) || bet <= 0)) {
                        return message.reply(getLang("invalidBet"));
                }

                if (bet && bet < 10) {
                        return message.reply(getLang("minBet"));
                }

                if (bet && userData.money < bet) {
                        return message.reply(getLang("insufficientMoney", userData.money.toLocaleString()));
                }

                switch (game) {
                        case "slots":
                        case "slot": {
                                if (!bet) return message.reply(getLang("invalidBet"));

                                const symbols = ["♣", "♦", "♥", "♠", "★", "7"];
                                const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
                                const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
                                const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

                                const display = `[ ${reel1} | ${reel2} | ${reel3} ]`;

                                let winnings = 0;
                                let isWin = false;

                                if (reel1 === reel2 && reel2 === reel3) {
                                        isWin = true;
                                        if (reel1 === "★") {
                                                winnings = bet * 10;
                                        } else if (reel1 === "7") {
                                                winnings = bet * 7;
                                        } else {
                                                winnings = bet * 5;
                                        }
                                        userData.money += winnings;
                                        await usersData.set(senderID, userData.money, "money");
                                } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
                                        isWin = true;
                                        winnings = bet * 2;
                                        userData.money += winnings;
                                        await usersData.set(senderID, userData.money, "money");
                                } else {
                                        userData.money -= bet;
                                        await usersData.set(senderID, userData.money, "money");
                                }

                                if (canvasAvailable) {
                                        try {
                                                const cardImage = await createSlotsCard(reel1, reel2, reel3, isWin, winnings, bet, userData.money);
                                                if (cardImage) {
                                                        const tempPath = cardImage.path;
                                                        cardImage.on('end', () => {
                                                                fs.unlink(tempPath).catch(() => {});
                                                        });
                                                        return message.reply({
                                                                attachment: cardImage
                                                        });
                                                }
                                        } catch (err) {
                                                console.error("Slots card error:", err);
                                        }
                                }

                                if (isWin) {
                                        return message.reply(getLang(reel1 === reel2 && reel2 === reel3 ? "slotsBigWin" : "slotsWin", display, winnings.toLocaleString(), userData.money.toLocaleString()));
                                } else {
                                        return message.reply(getLang("slotsLose", display, bet.toLocaleString(), userData.money.toLocaleString()));
                                }
                        }

                        case "coinflip":
                        case "flip": {
                                if (!bet) return message.reply(getLang("invalidBet"));

                                const choice = args[2]?.toLowerCase();
                                if (!choice || !["heads", "tails", "h", "t"].includes(choice)) {
                                        return message.reply(getLang("invalidChoice"));
                                }

                                const userChoice = choice.startsWith("h") ? "heads" : "tails";
                                const result = Math.random() < 0.5 ? "heads" : "tails";

                                const isWin = userChoice === result;
                                let winnings = 0;

                                if (isWin) {
                                        winnings = bet * 2;
                                        userData.money += winnings;
                                        await usersData.set(senderID, userData.money, "money");
                                } else {
                                        userData.money -= bet;
                                        await usersData.set(senderID, userData.money, "money");
                                }

                                if (canvasAvailable) {
                                        try {
                                                const cardImage = await createCoinflipCard(userChoice, result, isWin, winnings, bet, userData.money);
                                                if (cardImage) {
                                                        const tempPath = cardImage.path;
                                                        cardImage.on('end', () => {
                                                                fs.unlink(tempPath).catch(() => {});
                                                        });
                                                        return message.reply({
                                                                attachment: cardImage
                                                        });
                                                }
                                        } catch (err) {
                                                console.error("Coinflip card error:", err);
                                        }
                                }

                                if (isWin) {
                                        return message.reply(getLang("coinflipWin", userChoice, result, winnings.toLocaleString(), userData.money.toLocaleString()));
                                } else {
                                        return message.reply(getLang("coinflipLose", userChoice, result, bet.toLocaleString(), userData.money.toLocaleString()));
                                }
                        }

                        case "roulette": {
                                if (!bet) return message.reply(getLang("invalidBet"));

                                const color = args[2]?.toLowerCase();
                                if (!color || !["red", "black", "green"].includes(color)) {
                                        return message.reply(getLang("invalidColor"));
                                }

                                const rand = Math.random();
                                let result;
                                if (rand < 0.46) result = "red";
                                else if (rand < 0.92) result = "black";
                                else result = "green";

                                const isWin = color === result;
                                let winnings = 0;

                                if (isWin) {
                                        winnings = color === "green" ? bet * 35 : bet * 2;
                                        userData.money += winnings;
                                        await usersData.set(senderID, userData.money, "money");
                                } else {
                                        userData.money -= bet;
                                        await usersData.set(senderID, userData.money, "money");
                                }

                                if (canvasAvailable) {
                                        try {
                                                const cardImage = await createRouletteCard(color, result, isWin, winnings, bet, userData.money);
                                                if (cardImage) {
                                                        const tempPath = cardImage.path;
                                                        cardImage.on('end', () => {
                                                                fs.unlink(tempPath).catch(() => {});
                                                        });
                                                        return message.reply({
                                                                attachment: cardImage
                                                        });
                                                }
                                        } catch (err) {
                                                console.error("Roulette card error:", err);
                                        }
                                }

                                if (isWin) {
                                        if (color === "green") {
                                                return message.reply(getLang("rouletteBigWin", color, result, winnings.toLocaleString(), userData.money.toLocaleString()));
                                        }
                                        return message.reply(getLang("rouletteWin", color, result, winnings.toLocaleString(), userData.money.toLocaleString()));
                                } else {
                                        return message.reply(getLang("rouletteLose", color, result, bet.toLocaleString(), userData.money.toLocaleString()));
                                }
                        }

                        default: {
                                return message.reply(
                                        `🎰 CASINO GAMES 🎰\n\n` +
                                        `Available games:\n` +
                                        `🎰 Slots - Match 3 symbols\n` +
                                        `🪙 Coinflip - Heads or Tails\n` +
                                        `🎡 Roulette - Red, Black, or Green\n\n` +
                                        `Use: ${global.utils.getPrefix(event.threadID)}casino <game> <bet> [choice]`
                                );
                        }
                }
        }
};