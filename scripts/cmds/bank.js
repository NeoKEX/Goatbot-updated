const axios = require("axios");
const fs = require("fs-extra");

let createCanvas, loadImage, registerFont;
let canvasAvailable = false;
try {
        const canvas = require("canvas");
        createCanvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
        registerFont = canvas.registerFont;
        canvasAvailable = true;
        console.log("✅ [BANK] Canvas loaded successfully - cards will be generated");
} catch (err) {
        console.log("❌ [BANK] Canvas not available - using text-only cards. Error:", err.message);
        canvasAvailable = false;
}

function generateCardNumber() {
        const firstPart = Math.floor(1000 + Math.random() * 9000);
        const secondPart = Math.floor(1000 + Math.random() * 9000);
        const thirdPart = Math.floor(1000 + Math.random() * 9000);
        const fourthPart = Math.floor(1000 + Math.random() * 9000);
        return `${firstPart}-${secondPart}-${thirdPart}-${fourthPart}`;
}

function generateTransactionID() {
        return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function createBankCard(userData, balance, cardNumber, userID) {
        if (!canvasAvailable) {
                return null;
        }

        try {
                const canvas = createCanvas(1000, 630);
                const ctx = canvas.getContext("2d");

                roundRect(ctx, 0, 0, 1000, 630, 30);
                ctx.clip();

                const gradient = ctx.createLinearGradient(0, 0, 1000, 630);
                gradient.addColorStop(0, "#0f0c29");
                gradient.addColorStop(0.5, "#302b63");
                gradient.addColorStop(1, "#24243e");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1000, 630);

                for (let i = 0; i < 30; i++) {
                        const x = Math.random() * 1000;
                        const y = Math.random() * 630;
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
                ctx.shadowBlur = 40;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                roundRect(ctx, 20, 20, 960, 590, 20);
                ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
                roundRect(ctx, 50, 50, 180, 120, 15);
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = "#FFD700";
                roundRect(ctx, 780, 50, 170, 120, 15);
                ctx.fill();

                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowBlur = 10;
                ctx.fillStyle = "rgba(218, 165, 32, 0.8)";
                roundRect(ctx, 800, 70, 130, 30, 8);
                ctx.fill();
                ctx.fillStyle = "rgba(218, 165, 32, 0.8)";
                roundRect(ctx, 800, 110, 130, 30, 8);
                ctx.fill();
                ctx.shadowBlur = 0;

                const chipGradient = ctx.createRadialGradient(130, 110, 10, 130, 110, 50);
                chipGradient.addColorStop(0, "#FFE55C");
                chipGradient.addColorStop(0.5, "#FFD700");
                chipGradient.addColorStop(1, "#B8860B");
                ctx.fillStyle = chipGradient;
                ctx.beginPath();
                ctx.arc(130, 110, 50, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "#8B7500";
                ctx.lineWidth = 3;
                ctx.stroke();

                for (let i = 0; i < 4; i++) {
                        ctx.strokeStyle = "rgba(139, 117, 0, 0.6)";
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(130, 110, 40 - i * 10, 0, Math.PI * 2);
                        ctx.stroke();
                }

                ctx.font = "bold 48px Arial";
                ctx.fillStyle = "#FFFFFF";
                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowBlur = 10;
                ctx.fillText("GOAT PREMIUM BANK", 50, 250);
                ctx.shadowBlur = 0;

                ctx.font = "bold 42px 'Courier New'";
                const cardParts = cardNumber.split("-");
                const maskedCard = `****  ****  ****  ${cardParts[3]}`;

                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                ctx.shadowBlur = 5;

                const letterSpacing = 15;
                let xPos = 50;
                for (let i = 0; i < maskedCard.length; i++) {
                        const char = maskedCard[i];
                        const charGradient = ctx.createLinearGradient(xPos, 330, xPos, 380);
                        charGradient.addColorStop(0, "#FFFFFF");
                        charGradient.addColorStop(1, "#E0E0E0");
                        ctx.fillStyle = charGradient;
                        ctx.fillText(char, xPos, 360);
                        xPos += ctx.measureText(char).width + letterSpacing;
                }
                ctx.shadowBlur = 0;

                ctx.font = "20px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.fillText("CARD HOLDER", 50, 440);

                ctx.font = "bold 32px Arial";
                ctx.fillStyle = "#FFFFFF";
                const displayName = userData.name.toUpperCase();
                const truncatedName = displayName.length > 25 ? displayName.substring(0, 22) + "..." : displayName;
                ctx.fillText(truncatedName, 50, 480);

                ctx.font = "20px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.fillText("VALID THRU", 520, 440);
                ctx.font = "bold 26px Arial";
                ctx.fillStyle = "#FFFFFF";
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 3);
                const month = String(expiryDate.getMonth() + 1).padStart(2, "0");
                const year = String(expiryDate.getFullYear()).slice(-2);
                ctx.fillText(`${month}/${year}`, 520, 480);

                ctx.font = "20px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.fillText("BALANCE", 50, 545);

                ctx.font = "bold 44px Arial";
                const balanceGradient = ctx.createLinearGradient(50, 565, 400, 565);
                balanceGradient.addColorStop(0, "#FFD700");
                balanceGradient.addColorStop(0.5, "#FFA500");
                balanceGradient.addColorStop(1, "#FFD700");
                ctx.fillStyle = balanceGradient;
                ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
                ctx.shadowBlur = 20;
                ctx.fillText(`$${balance.toLocaleString()}`, 50, 590);
                ctx.shadowBlur = 0;

                ctx.font = "italic 18px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.fillText(Buffer.from("UG93ZXJlZCBieSBOZW9LRVg=", "base64").toString(), 750, 590);

                const buffer = canvas.toBuffer();
                const tempPath = `./tmp/bank_card_${Date.now()}.png`;
                await fs.outputFile(tempPath, buffer);
                return fs.createReadStream(tempPath);
        } catch (error) {
                console.error("Canvas error:", error.message);
                throw error;
        }
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

module.exports = {
        config: {
                name: "bank",
                version: "3.0.0",
                author: "NeoKEX",
                countDown: 10,
                role: 0,
                description: {
                        vi: "Hệ thống ngân hàng cao cấp với thẻ, chuyển khoản, vay",
                        en: "Premium banking system with cards, transfers, loans"
                },
                category: "economy",
                guide: {
                        en: "   {pn} register - Register for a premium bank account"
                                + "\n   {pn} balance | bal - View your premium bank card with balance"
                                + "\n   {pn} transfer <@tag|userID> <amount> - Transfer money to another user"
                                + "\n   {pn} deposit <amount> - Deposit money from wallet to bank"
                                + "\n   {pn} withdraw <amount> - Withdraw money from bank to wallet"
                                + "\n   {pn} loan <amount> - Take a loan (max 5000, 10% interest)"
                                + "\n   {pn} payloan <amount> - Pay back your loan"
                                + "\n   {pn} transactions | history - View your transaction history"
                                + "\n   {pn} card - View your premium bank card details"
                }
        },

        langs: {
                en: {
                        notRegistered: "❌ You don't have a bank account! Use {pn} register to create one.",
                        registered: "✅ Bank account created successfully!\n💳 Card Number: %1\n💰 Initial Balance: $0\n\nUse {pn} balance to view your premium card!",
                        alreadyRegistered: "❌ You already have a bank account!\n💳 Card Number: %1",
                        invalidAmount: "❌ Please enter a valid amount!",
                        insufficientBank: "❌ Insufficient bank balance! Your balance: $%1",
                        insufficientWallet: "❌ Insufficient wallet balance! Your balance: $%1",
                        depositSuccess: "✅ Successfully deposited $%1 to your bank account!\n💳 Transaction ID: %2\n💰 New Bank Balance: $%3",
                        withdrawSuccess: "✅ Successfully withdrew $%1 from your bank account!\n💳 Transaction ID: %2\n💰 New Bank Balance: $%3",
                        transferSuccess: "✅ Successfully transferred $%1 to %2!\n💳 Transaction ID: %3\n💰 Your New Balance: $%4",
                        transferReceived: "💰 You received $%1 from %2!\n💳 Transaction ID: %3",
                        cannotTransferSelf: "❌ You cannot transfer money to yourself!",
                        targetNotRegistered: "❌ Target user doesn't have a bank account!",
                        loanTaken: "✅ Loan approved!\n💵 Amount: $%1\n📈 Interest (10%%): $%2\n💰 Total to repay: $%3\n💳 Transaction ID: %4",
                        loanExists: "❌ You already have an active loan of $%1!\nPay it back first using {pn} payloan",
                        loanPaid: "✅ Loan payment successful!\n💵 Paid: $%1\n💰 Remaining: $%2",
                        noLoan: "✅ You don't have any active loans!",
                        noTransactions: "📋 No transaction history found.",
                        transactionHistory: "📋 Transaction History (Last 10):\n\n%1",
                        noTarget: "❌ Please mention or provide user ID to transfer!",
                        maxLoan: "❌ Maximum loan amount is $5000!"
                }
        },

        onStart: async function ({ args, message, event, usersData, getLang, commandName }) {
                const { senderID, threadID } = event;
                const userData = await usersData.get(senderID);

                if (!userData.data.bank) {
                        userData.data.bank = {
                                cardNumber: null,
                                balance: 0,
                                transactions: [],
                                loan: 0
                        };
                }

                const action = args[0]?.toLowerCase();

                switch (action) {
                        case "register": {
                                if (userData.data.bank.cardNumber) {
                                        return message.reply(getLang("alreadyRegistered", userData.data.bank.cardNumber));
                                }
                                const cardNumber = generateCardNumber();
                                userData.data.bank.cardNumber = cardNumber;
                                userData.data.bank.balance = 0;
                                userData.data.bank.transactions = [];
                                userData.data.bank.loan = 0;
                                await usersData.set(senderID, userData.data, "data");
                                return message.reply(getLang("registered", cardNumber));
                        }

                        case "balance":
                        case "bal": {
                                if (!userData.data.bank.cardNumber) {
                                        return message.reply(getLang("notRegistered").replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }

                                const maskedCard = userData.data.bank.cardNumber.replace(/(\d{4})-(\d{4})-(\d{4})-(\d{4})/, "****-****-****-$4");
                                const cardText = `╔══════════════════════════════╗
║     💎 PREMIUM BANK CARD 💎    ║
╠══════════════════════════════╣
║                              ║
║  Card Number:                ║
║  ${maskedCard}          ║
║                              ║
║  Card Holder:                ║
║  ${userData.name.toUpperCase().padEnd(26)}  ║
║                              ║
║  Balance: $${userData.data.bank.balance.toLocaleString().padEnd(18)} ║
║                              ║
${userData.data.bank.loan > 0 ? `║  ⚠️ Loan: $${userData.data.bank.loan.toLocaleString().padEnd(18)} ║\n║                              ║\n` : ''}╠══════════════════════════════╣
║         GOAT BANK V3         ║
╚══════════════════════════════╝`;

                                try {
                                        console.log("[BANK] Creating bank card for user:", senderID);
                                        const cardImage = await createBankCard(userData, userData.data.bank.balance, userData.data.bank.cardNumber, senderID);
                                        console.log("[BANK] Card created, has buffer:", !!cardImage);
                                        if (cardImage) {
                                                const tempPath = cardImage.path;
                                                console.log("[BANK] Card buffer path:", tempPath);
                                                console.log("[BANK] Sending card image only...");

                                                cardImage.on('end', () => {
                                                        fs.unlink(tempPath).catch(() => {});
                                                });

                                                return message.reply({
                                                        attachment: cardImage
                                                });
                                        }
                                } catch (err) {
                                        console.error("Bank card generation error:", err);
                                }
                                console.log("[BANK] Sending text-only response");
                                return message.reply(cardText);
                        }

                        case "deposit": {
                                if (!userData.data.bank.cardNumber) {
                                        return message.reply(getLang("notRegistered").replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }
                                const amount = parseInt(args[1]);
                                if (isNaN(amount) || amount <= 0) {
                                        return message.reply(getLang("invalidAmount"));
                                }
                                if (userData.money < amount) {
                                        return message.reply(getLang("insufficientWallet", userData.money.toLocaleString()));
                                }
                                userData.money -= amount;
                                userData.data.bank.balance += amount;
                                const txnID = generateTransactionID();
                                userData.data.bank.transactions.unshift({
                                        type: "deposit",
                                        amount: amount,
                                        txnID: txnID,
                                        date: new Date().toISOString()
                                });
                                if (userData.data.bank.transactions.length > 50) {
                                        userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                                }
                                await usersData.set(senderID, {
                                        money: userData.money,
                                        data: userData.data
                                });
                                return message.reply(getLang("depositSuccess", amount.toLocaleString(), txnID, userData.data.bank.balance.toLocaleString()));
                        }

                        case "withdraw": {
                                if (!userData.data.bank.cardNumber) {
                                        return message.reply(getLang("notRegistered").replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }
                                const amount = parseInt(args[1]);
                                if (isNaN(amount) || amount <= 0) {
                                        return message.reply(getLang("invalidAmount"));
                                }
                                if (userData.data.bank.balance < amount) {
                                        return message.reply(getLang("insufficientBank", userData.data.bank.balance.toLocaleString()));
                                }
                                userData.money += amount;
                                userData.data.bank.balance -= amount;
                                const txnID = generateTransactionID();
                                userData.data.bank.transactions.unshift({
                                        type: "withdrawal",
                                        amount: amount,
                                        txnID: txnID,
                                        date: new Date().toISOString()
                                });
                                if (userData.data.bank.transactions.length > 50) {
                                        userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                                }
                                await usersData.set(senderID, {
                                        money: userData.money,
                                        data: userData.data
                                });
                                return message.reply(getLang("withdrawSuccess", amount.toLocaleString(), txnID, userData.data.bank.balance.toLocaleString()));
                        }

                        case "transfer": {
                                if (!userData.data.bank.cardNumber) {
                                        return message.reply(getLang("notRegistered").replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }
                                let targetID = Object.keys(event.mentions)[0];
                                let amountArg;
                                if (targetID) {
                                        amountArg = args[1];
                                } else if (args[1]) {
                                        targetID = args[1];
                                        amountArg = args[2];
                                }
                                if (!targetID) {
                                        return message.reply(getLang("noTarget"));
                                }
                                if (targetID == senderID) {
                                        return message.reply(getLang("cannotTransferSelf"));
                                }
                                if (!amountArg) {
                                        return message.reply("❌ Please provide an amount to transfer!\n\nUsage:\n• " + global.utils.getPrefix(threadID) + "bank transfer @user <amount>\n• " + global.utils.getPrefix(threadID) + "bank transfer <userID> <amount>");
                                }
                                const amount = parseInt(amountArg);
                                if (isNaN(amount) || amount <= 0) {
                                        return message.reply(`❌ Invalid amount: "${amountArg}"\nPlease enter a valid number greater than 0.\n\nExample: ${global.utils.getPrefix(threadID)}bank transfer @user 1000`);
                                }
                                if (userData.data.bank.balance < amount) {
                                        return message.reply(getLang("insufficientBank", userData.data.bank.balance.toLocaleString()));
                                }
                                const targetData = await usersData.get(targetID);
                                if (!targetData.data.bank?.cardNumber) {
                                        return message.reply(getLang("targetNotRegistered"));
                                }
                                userData.data.bank.balance -= amount;
                                targetData.data.bank.balance += amount;
                                const txnID = generateTransactionID();
                                userData.data.bank.transactions.unshift({
                                        type: "transfer_sent",
                                        amount: amount,
                                        to: targetData.name,
                                        toID: targetID,
                                        txnID: txnID,
                                        date: new Date().toISOString()
                                });
                                targetData.data.bank.transactions.unshift({
                                        type: "transfer_received",
                                        amount: amount,
                                        from: userData.name,
                                        fromID: senderID,
                                        txnID: txnID,
                                        date: new Date().toISOString()
                                });
                                if (userData.data.bank.transactions.length > 50) {
                                        userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                                }
                                if (targetData.data.bank.transactions.length > 50) {
                                        targetData.data.bank.transactions = targetData.data.bank.transactions.slice(0, 50);
                                }
                                await usersData.set(senderID, userData.data, "data");
                                await usersData.set(targetID, targetData.data, "data");
                                message.reply(getLang("transferSuccess", amount.toLocaleString(), targetData.name, txnID, userData.data.bank.balance.toLocaleString()));
                                global.GoatBot.onReply.set(message.messageID, {
                                        commandName,
                                        messageID: message.messageID,
                                        author: targetID,
                                        txnID: txnID,
                                        amount: amount,
                                        from: userData.name
                                });
                                return;
                        }

                        case "loan": {
                                if (!userData.data.bank.cardNumber) {
                                        return message.reply(getLang("notRegistered").replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }
                                if (userData.data.bank.loan > 0) {
                                        return message.reply(getLang("loanExists", userData.data.bank.loan.toLocaleString()).replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }
                                const amount = parseInt(args[1]);
                                if (isNaN(amount) || amount <= 0) {
                                        return message.reply(getLang("invalidAmount"));
                                }
                                if (amount > 5000) {
                                        return message.reply(getLang("maxLoan"));
                                }
                                const interest = Math.floor(amount * 0.1);
                                const totalLoan = amount + interest;
                                userData.data.bank.balance += amount;
                                userData.data.bank.loan = totalLoan;
                                const txnID = generateTransactionID();
                                userData.data.bank.transactions.unshift({
                                        type: "loan",
                                        amount: amount,
                                        interest: interest,
                                        total: totalLoan,
                                        txnID: txnID,
                                        date: new Date().toISOString()
                                });
                                if (userData.data.bank.transactions.length > 50) {
                                        userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                                }
                                await usersData.set(senderID, userData.data, "data");
                                return message.reply(getLang("loanTaken", amount.toLocaleString(), interest.toLocaleString(), totalLoan.toLocaleString(), txnID));
                        }

                        case "payloan": {
                                if (!userData.data.bank.cardNumber) {
                                        return message.reply(getLang("notRegistered").replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }
                                if (userData.data.bank.loan <= 0) {
                                        return message.reply(getLang("noLoan"));
                                }
                                const amount = parseInt(args[1]);
                                if (isNaN(amount) || amount <= 0) {
                                        return message.reply(getLang("invalidAmount"));
                                }
                                if (userData.data.bank.balance < amount) {
                                        return message.reply(getLang("insufficientBank", userData.data.bank.balance.toLocaleString()));
                                }
                                const payAmount = Math.min(amount, userData.data.bank.loan);
                                userData.data.bank.balance -= payAmount;
                                userData.data.bank.loan -= payAmount;
                                const txnID = generateTransactionID();
                                userData.data.bank.transactions.unshift({
                                        type: "loan_payment",
                                        amount: payAmount,
                                        txnID: txnID,
                                        date: new Date().toISOString()
                                });
                                if (userData.data.bank.transactions.length > 50) {
                                        userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                                }
                                await usersData.set(senderID, userData.data, "data");
                                return message.reply(getLang("loanPaid", payAmount.toLocaleString(), userData.data.bank.loan.toLocaleString()));
                        }

                        case "transactions":
                        case "history": {
                                if (!userData.data.bank.cardNumber) {
                                        return message.reply(getLang("notRegistered").replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }
                                if (!userData.data.bank.transactions || userData.data.bank.transactions.length === 0) {
                                        return message.reply(getLang("noTransactions"));
                                }
                                let historyText = "";
                                const transactions = userData.data.bank.transactions.slice(0, 10);
                                transactions.forEach((txn, index) => {
                                        const date = new Date(txn.date).toLocaleString();
                                        const icon = {
                                                deposit: "📥",
                                                withdrawal: "📤",
                                                transfer_sent: "➡️",
                                                transfer_received: "⬅️",
                                                loan: "💵",
                                                loan_payment: "💸"
                                        }[txn.type] || "💳";
                                        historyText += `${index + 1}. ${icon} ${txn.type.toUpperCase().replace(/_/g, " ")}\n`;
                                        historyText += `   💰 Amount: $${txn.amount.toLocaleString()}\n`;
                                        if (txn.to) historyText += `   👤 To: ${txn.to}\n`;
                                        if (txn.from) historyText += `   👤 From: ${txn.from}\n`;
                                        historyText += `   🆔 ID: ${txn.txnID}\n`;
                                        historyText += `   📅 ${date}\n\n`;
                                });
                                return message.reply(getLang("transactionHistory", historyText));
                        }

                        case "card": {
                                if (!userData.data.bank.cardNumber) {
                                        return message.reply(getLang("notRegistered").replace("{pn}", global.utils.getPrefix(threadID) + commandName));
                                }
                                return message.reply(`💳 Premium Bank Card Details\n\n👤 Card Holder: ${userData.name}\n🔢 Card Number: ${userData.data.bank.cardNumber}\n💰 Balance: $${userData.data.bank.balance.toLocaleString()}\n📊 Total Transactions: ${userData.data.bank.transactions.length}\n${userData.data.bank.loan > 0 ? `⚠️ Active Loan: $${userData.data.bank.loan.toLocaleString()}` : "✅ No Active Loans"}`);
                        }

                        default: {
                                const prefix = global.utils.getPrefix(threadID);
                                return message.reply(`🏦 NEOKEX BANK - Premium Banking System\n\n` +
                                        `📋 Available Commands:\n\n` +
                                        `${prefix}${commandName} register - Create account\n` +
                                        `${prefix}${commandName} balance - View card\n` +
                                        `${prefix}${commandName} deposit <amount> - Deposit money\n` +
                                        `${prefix}${commandName} withdraw <amount> - Withdraw money\n` +
                                        `${prefix}${commandName} transfer <@user> <amount> - Transfer\n` +
                                        `${prefix}${commandName} loan <amount> - Take loan (max $5000)\n` +
                                        `${prefix}${commandName} payloan <amount> - Pay loan\n` +
                                        `${prefix}${commandName} transactions - View history\n` +
                                        `${prefix}${commandName} card - View card details\n\n` +
                                        `💎 Premium users (2000+ money) get exclusive benefits!`);
                        }
                }
        }
};