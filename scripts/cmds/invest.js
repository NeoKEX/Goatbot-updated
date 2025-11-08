const fs = require("fs-extra");

let createCanvas, loadImage;
let canvasAvailable = false;
try {
        const canvas = require("canvas");
        createCanvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
        canvasAvailable = true;
        console.log("✅ [INVEST] Canvas loaded successfully - cards will be generated");
} catch (err) {
        console.log("❌ [INVEST] Canvas not available - using text-only mode. Error:", err.message);
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

async function createInvestCard(stocks, getCurrentPrice) {
        if (!canvasAvailable) {
                return null;
        }

        try {
                const canvas = createCanvas(1400, 950);
                const ctx = canvas.getContext("2d");

                roundRect(ctx, 0, 0, 1400, 950, 35);
                ctx.clip();

                const bgGradient = ctx.createLinearGradient(0, 0, 1400, 950);
                bgGradient.addColorStop(0, "#0a1929");
                bgGradient.addColorStop(0.5, "#1a2332");
                bgGradient.addColorStop(1, "#0a1929");
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, 1400, 950);

                for (let i = 0; i < 60; i++) {
                        const x = Math.random() * 1400;
                        const y = Math.random() * 950;
                        const radius = Math.random() * 100 + 50;
                        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        innerGradient.addColorStop(0, `rgba(76, 175, 80, ${Math.random() * 0.1})`);
                        innerGradient.addColorStop(1, "rgba(76, 175, 80, 0)");
                        ctx.fillStyle = innerGradient;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                ctx.shadowColor = "rgba(76, 175, 80, 0.5)";
                ctx.shadowBlur = 40;
                roundRect(ctx, 20, 20, 1360, 910, 30);
                ctx.strokeStyle = "rgba(76, 175, 80, 0.7)";
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.shadowBlur = 0;

                roundRect(ctx, 50, 50, 1300, 130, 20);
                const headerGradient = ctx.createLinearGradient(50, 50, 50, 180);
                headerGradient.addColorStop(0, "rgba(76, 175, 80, 0.25)");
                headerGradient.addColorStop(1, "rgba(76, 175, 80, 0.08)");
                ctx.fillStyle = headerGradient;
                ctx.fill();
                ctx.strokeStyle = "rgba(76, 175, 80, 0.4)";
                ctx.lineWidth = 2;
                ctx.stroke();

                const titleGradient = ctx.createLinearGradient(0, 90, 0, 140);
                titleGradient.addColorStop(0, "#4CAF50");
                titleGradient.addColorStop(0.5, "#66BB6A");
                titleGradient.addColorStop(1, "#4CAF50");
                ctx.fillStyle = titleGradient;
                ctx.font = "bold 68px Arial";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(76, 175, 80, 0.8)";
                ctx.shadowBlur = 30;
                ctx.fillText("⊕ INVESTMENT BANK ⊕", 700, 135);
                ctx.shadowBlur = 0;

                ctx.font = "bold 24px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
                ctx.fillText("Live Market Prices", 700, 165);

                const stockEntries = Object.entries(stocks);
                const cardWidth = 400;
                const cardHeight = 180;
                const startX = 90;
                const startY = 220;
                const spacingX = 440;
                const spacingY = 205;

                stockEntries.forEach(([symbol, stock], index) => {
                        const row = Math.floor(index / 3);
                        const col = index % 3;
                        const x = startX + (col * spacingX);
                        const y = startY + (row * spacingY);

                        const price = getCurrentPrice(stock);
                        const change = ((price - stock.basePrice) / stock.basePrice * 100).toFixed(2);
                        const isPositive = change >= 0;
                        const trendColor = isPositive ? "#4CAF50" : "#F44336";

                        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                        ctx.shadowBlur = 20;
                        roundRect(ctx, x, y, cardWidth, cardHeight, 15);

                        const cardGradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
                        cardGradient.addColorStop(0, "rgba(40, 60, 90, 0.7)");
                        cardGradient.addColorStop(1, "rgba(20, 35, 55, 0.7)");
                        ctx.fillStyle = cardGradient;
                        ctx.fill();

                        ctx.strokeStyle = "rgba(76, 175, 80, 0.5)";
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.shadowBlur = 0;

                        ctx.font = "bold 48px Arial";
                        ctx.fillStyle = "#4CAF50";
                        ctx.textAlign = "center";
                        ctx.fillText(stock.icon, x + 55, y + 65);

                        ctx.font = "bold 32px Arial";
                        ctx.fillStyle = "#FFFFFF";
                        ctx.textAlign = "left";
                        ctx.fillText(symbol, x + 100, y + 50);

                        ctx.font = "20px Arial";
                        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                        ctx.fillText(stock.name, x + 100, y + 80);

                        ctx.font = "bold 38px Arial";
                        ctx.fillStyle = "#FFD700";
                        ctx.fillText(`$${price}`, x + 100, y + 125);

                        ctx.font = "bold 26px Arial";
                        ctx.fillStyle = trendColor;
                        ctx.textAlign = "right";
                        const arrow = isPositive ? "▲" : "▼";
                        ctx.fillText(`${arrow} ${Math.abs(change)}%`, x + cardWidth - 20, y + 125);

                        roundRect(ctx, x + 10, y + 140, cardWidth - 20, 8, 4);
                        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                        ctx.fill();

                        const barWidth = Math.min(Math.abs(change) * 2, cardWidth - 20);
                        roundRect(ctx, x + 10, y + 140, barWidth, 8, 4);
                        const barGrad = ctx.createLinearGradient(x + 10, y + 140, x + 10 + barWidth, y + 140);
                        barGrad.addColorStop(0, trendColor);
                        barGrad.addColorStop(1, trendColor + "88");
                        ctx.fillStyle = barGrad;
                        ctx.fill();

                        ctx.font = "16px Arial";
                        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                        ctx.textAlign = "center";
                        ctx.fillText(`Volatility: ${(stock.volatility * 100).toFixed(0)}%`, x + cardWidth / 2, y + 170);
                });

                ctx.font = "italic 20px Arial";
                ctx.fillStyle = "rgba(76, 175, 80, 0.7)";
                ctx.textAlign = "center";
                ctx.fillText("Powered by NeoKEX", 700, 920);

                const buffer = canvas.toBuffer();
                const tempPath = `./tmp/invest_card_${Date.now()}.png`;
                await fs.outputFile(tempPath, buffer);
                return fs.createReadStream(tempPath);
        } catch (error) {
                console.error("Canvas error in invest card:", error.message);
                return null;
        }
}

module.exports = {
        config: {
                name: "invest",
                aliases: ["stock", "crypto"],
                version: "3.0.0",
                author: "NeoKEX",
                countDown: 10,
                role: 0,
                description: {
                        en: "Invest in stocks and crypto (simulation)"
                },
                category: "economy",
                guide: {
                        en: "   {pn} list - View available investments"
                                + "\n   {pn} buy <stock> <amount> - Buy stocks"
                                + "\n   {pn} sell <stock> <amount> - Sell stocks"
                                + "\n   {pn} portfolio - View your investments"
                }
        },

        langs: {
                en: {
                        marketList: "⊕ INVESTMENT BANK ⊕\n\n%1\n\nUse {pn} buy <stock> <amount> to invest!",
                        bought: "✅ Purchased %1 shares of %2 at $%3/share\nTotal: $%4\nNew Balance: $%5",
                        sold: "✅ Sold %1 shares of %2 at $%3/share\nTotal: $%4\nNew Balance: $%5",
                        insufficientMoney: "Insufficient funds! Need: $%1, Have: $%2",
                        invalidStock: "Invalid stock! Use {pn} list to view available stocks.",
                        invalidAmount: "Please enter a valid amount!",
                        portfolio: "YOUR PORTFOLIO\n\n%1\n\nTotal Value: $%2\nProfit/Loss: $%3 (%4%)",
                        emptyPortfolio: "Your portfolio is empty! Start investing!",
                        insufficientShares: "You don't have enough shares! You have: %1"
                }
        },

        onStart: async function ({ args, message, event, usersData, getLang, commandName }) {
                const { senderID, threadID } = event;
                const userData = await usersData.get(senderID);

                if (!userData.data.investments) {
                        userData.data.investments = {};
                }

                const stocks = {
                        GOAT: { name: "GoatCoin", basePrice: 100, volatility: 0.15, icon: "◉" },
                        TECH: { name: "TechCorp", basePrice: 250, volatility: 0.20, icon: "▲" },
                        GOLD: { name: "Gold", basePrice: 500, volatility: 0.10, icon: "◈" },
                        MEME: { name: "MemeCoin", basePrice: 50, volatility: 0.30, icon: "◎" },
                        ENERGY: { name: "Energy", basePrice: 300, volatility: 0.12, icon: "◆" }
                };

                function getCurrentPrice(stock) {
                        const timeVariation = Math.sin(Date.now() / 10000000) * stock.volatility;
                        const randomVariation = (Math.random() - 0.5) * stock.volatility;
                        return Math.floor(stock.basePrice * (1 + timeVariation + randomVariation));
                }

                const action = args[0]?.toLowerCase();

                switch (action) {
                        case "list": {
                                try {
                                        console.log("[INVEST] Creating investment market card...");
                                        const cardImage = await createInvestCard(stocks, getCurrentPrice);

                                        if (cardImage) {
                                                const tempPath = cardImage.path;
                                                console.log("[INVEST] Card created, sending image...");

                                                cardImage.on('end', () => {
                                                        fs.unlink(tempPath).catch(() => {});
                                                });

                                                return message.reply({
                                                        attachment: cardImage
                                                });
                                        }
                                } catch (err) {
                                        console.error("Invest card generation error:", err);
                                }

                                console.log("[INVEST] Sending text-only response");
                                let marketList = "";
                                for (const [symbol, stock] of Object.entries(stocks)) {
                                        const price = getCurrentPrice(stock);
                                        const change = ((price - stock.basePrice) / stock.basePrice * 100).toFixed(2);
                                        const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "=";
                                        marketList += `${stock.icon} ${symbol} - ${stock.name}\n   $${price}/share ${arrow} ${change}%\n\n`;
                                }
                                const prefix = global.utils.getPrefix(threadID);
                                return message.reply(getLang("marketList", marketList).replace("{pn}", `${prefix}${commandName}`));
                        }

                        case "buy": {
                                const stockSymbol = args[1]?.toUpperCase();
                                const amount = parseInt(args[2]);

                                if (!stockSymbol || !stocks[stockSymbol]) {
                                        const prefix = global.utils.getPrefix(threadID);
                                        return message.reply(getLang("invalidStock").replace("{pn}", `${prefix}${commandName}`));
                                }

                                if (isNaN(amount) || amount <= 0) {
                                        return message.reply(getLang("invalidAmount"));
                                }

                                const stock = stocks[stockSymbol];
                                const price = getCurrentPrice(stock);
                                const totalCost = price * amount;

                                if (userData.money < totalCost) {
                                        return message.reply(getLang("insufficientMoney", totalCost.toLocaleString(), userData.money.toLocaleString()));
                                }

                                userData.money -= totalCost;

                                if (!userData.data.investments[stockSymbol]) {
                                        userData.data.investments[stockSymbol] = { shares: 0, totalPaid: 0 };
                                }

                                userData.data.investments[stockSymbol].shares += amount;
                                userData.data.investments[stockSymbol].totalPaid += totalCost;

                                await usersData.set(senderID, {
                                        money: userData.money,
                                        data: userData.data
                                });

                                return message.reply(getLang("bought", amount, stockSymbol, price.toLocaleString(), totalCost.toLocaleString(), userData.money.toLocaleString()));
                        }

                        case "sell": {
                                const stockSymbol = args[1]?.toUpperCase();
                                const amount = parseInt(args[2]);

                                if (!stockSymbol || !stocks[stockSymbol]) {
                                        const prefix = global.utils.getPrefix(threadID);
                                        return message.reply(getLang("invalidStock").replace("{pn}", `${prefix}${commandName}`));
                                }

                                if (isNaN(amount) || amount <= 0) {
                                        return message.reply(getLang("invalidAmount"));
                                }

                                if (!userData.data.investments[stockSymbol] || userData.data.investments[stockSymbol].shares < amount) {
                                        const currentShares = userData.data.investments[stockSymbol]?.shares || 0;
                                        return message.reply(getLang("insufficientShares", currentShares));
                                }

                                const stock = stocks[stockSymbol];
                                const price = getCurrentPrice(stock);
                                const totalValue = price * amount;

                                userData.money += totalValue;
                                userData.data.investments[stockSymbol].shares -= amount;

                                if (userData.data.investments[stockSymbol].shares === 0) {
                                        delete userData.data.investments[stockSymbol];
                                }

                                await usersData.set(senderID, {
                                        money: userData.money,
                                        data: userData.data
                                });

                                return message.reply(getLang("sold", amount, stockSymbol, price.toLocaleString(), totalValue.toLocaleString(), userData.money.toLocaleString()));
                        }

                        case "portfolio":
                        case "port": {
                                if (Object.keys(userData.data.investments).length === 0) {
                                        return message.reply(getLang("emptyPortfolio"));
                                }

                                let portfolioList = "";
                                let totalValue = 0;
                                let totalPaid = 0;

                                for (const [symbol, investment] of Object.entries(userData.data.investments)) {
                                        const stock = stocks[symbol];
                                        if (!stock) continue;

                                        const currentPrice = getCurrentPrice(stock);
                                        const value = currentPrice * investment.shares;
                                        const profit = value - investment.totalPaid;
                                        const profitPercent = ((profit / investment.totalPaid) * 100).toFixed(2);
                                        const arrow = profit > 0 ? "📈" : profit < 0 ? "📉" : "➡️";

                                        totalValue += value;
                                        totalPaid += investment.totalPaid;

                                        portfolioList += `${stock.icon} ${symbol} - ${investment.shares} shares\n   Value: $${value.toLocaleString()} ${arrow} ${profitPercent}%\n\n`;
                                }

                                const totalProfit = totalValue - totalPaid;
                                const totalProfitPercent = ((totalProfit / totalPaid) * 100).toFixed(2);

                                return message.reply(getLang("portfolio", portfolioList, totalValue.toLocaleString(), totalProfit.toLocaleString(), totalProfitPercent));
                        }

                        default: {
                                return message.reply(
                                        `📈 INVESTMENT CENTER 📈\n\n` +
                                        `Commands:\n` +
                                        `📊 list - View market\n` +
                                        `💰 buy <stock> <amount> - Buy shares\n` +
                                        `💵 sell <stock> <amount> - Sell shares\n` +
                                        `💼 portfolio - View holdings\n\n` +
                                        `⚠️ Prices fluctuate - invest wisely!`
                                );
                        }
                }
        }
};