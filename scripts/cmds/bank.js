const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const moment = require("moment-timezone");

const BANK_NAME = "GOAT BANK";
const BANK_CODE = "GOAT";
const CURRENCY_SYMBOL = "$";
const INTEREST_RATE = 0.02;
const DAILY_WITHDRAW_LIMIT = 50000;
const DAILY_TRANSFER_LIMIT = 100000;
const MIN_DEPOSIT = 100;
const MIN_WITHDRAW = 100;
const MIN_TRANSFER = 50;
const CARD_ANNUAL_FEE = 500;
const CARD_VALIDITY_YEARS = 5;

const fontPath = path.join(__dirname, "assets", "font", "BeVietnamPro-Bold.ttf");
const fontPathRegular = path.join(__dirname, "assets", "font", "BeVietnamPro-Regular.ttf");

try {
    if (fs.existsSync(fontPath)) registerFont(fontPath, { family: "BankFont", weight: "bold" });
    if (fs.existsSync(fontPathRegular)) registerFont(fontPathRegular, { family: "BankFontRegular" });
} catch (e) {}

function generateAccountNumber() {
    return "GB" + Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
}

function generateCardNumber() {
    let card = "4";
    for (let i = 0; i < 15; i++) {
        card += Math.floor(Math.random() * 10);
    }
    return card;
}

function generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
}

function generatePIN() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function hashPIN(pin) {
    return crypto.createHash("sha256").update(pin + "goatbank_salt").digest("hex");
}

function formatCardNumber(cardNumber) {
    return cardNumber.replace(/(.{4})/g, "$1 ").trim();
}

function formatMoney(amount) {
    return amount.toLocaleString("en-US");
}

function getExpiryDate(yearsFromNow = CARD_VALIDITY_YEARS) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + yearsFromNow);
    return (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getFullYear().toString().slice(-2);
}

async function createBankCard(cardData, userData) {
    const width = 850;
    const height = 540;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (cardData.cardType === "platinum") {
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(0.3, "#16213e");
        gradient.addColorStop(0.6, "#0f3460");
        gradient.addColorStop(1, "#1a1a2e");
    } else if (cardData.cardType === "gold") {
        gradient.addColorStop(0, "#b8860b");
        gradient.addColorStop(0.3, "#daa520");
        gradient.addColorStop(0.6, "#ffd700");
        gradient.addColorStop(1, "#b8860b");
    } else {
        gradient.addColorStop(0, "#2c3e50");
        gradient.addColorStop(0.3, "#34495e");
        gradient.addColorStop(0.6, "#5d6d7e");
        gradient.addColorStop(1, "#2c3e50");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 30);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(10, 10, width - 20, height - 20, 25);
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + i * 0.01})`;
        ctx.lineWidth = 1;
        ctx.arc(width * 0.7 + i * 20, height * 0.3 - i * 10, 150 + i * 30, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.roundRect(50, 150, 90, 70, 8);
    ctx.fill();

    ctx.strokeStyle = "#a67c00";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(50, 158 + i * 13);
        ctx.lineTo(140, 158 + i * 13);
        ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(65 + i * 25, 150);
        ctx.lineTo(65 + i * 25, 220);
        ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillText(BANK_NAME, 50, 80);

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = cardData.cardType === "gold" ? "#1a1a1a" : "#ffffff";
    const typeText = cardData.cardType.toUpperCase();
    ctx.fillText(typeText, width - ctx.measureText(typeText).width - 50, 80);

    ctx.font = "bold 42px Arial, monospace";
    ctx.fillStyle = "#ffffff";
    ctx.letterSpacing = "4px";
    const formattedCard = formatCardNumber(cardData.cardNumber);
    ctx.fillText(formattedCard, 50, 300);

    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("VALID THRU", 50, 360);
    ctx.fillText("CVV", 200, 360);

    ctx.font = "bold 22px Arial, monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(cardData.expiryDate, 50, 390);
    ctx.fillText("***", 200, 390);

    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    const holderName = userData.name.toUpperCase().slice(0, 25);
    ctx.fillText(holderName, 50, 470);

    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("DEBIT", width - 100, 470);

    ctx.fillStyle = "#ff5f00";
    ctx.beginPath();
    ctx.arc(width - 130, 180, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eb001b";
    ctx.beginPath();
    ctx.arc(width - 90, 180, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255, 95, 0, 0.5)";
    ctx.beginPath();
    ctx.arc(width - 110, 180, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.font = "12px Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(`ACC: ${cardData.accountNumber}`, 50, height - 30);

    const buffer = canvas.toBuffer("image/png");
    const outputPath = path.join(__dirname, "tmp", `card_${cardData.cardNumber.slice(-4)}_${Date.now()}.png`);
    await fs.ensureDir(path.join(__dirname, "tmp"));
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}

async function createTransactionReceipt(transaction, senderData, receiverData = null) {
    const width = 600;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const headerGradient = ctx.createLinearGradient(0, 0, width, 120);
    headerGradient.addColorStop(0, "#1a1a2e");
    headerGradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, 120);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(BANK_NAME, width / 2, 55);
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("TRANSACTION RECEIPT", width / 2, 90);

    ctx.textAlign = "left";
    ctx.fillStyle = "#333333";
    let y = 160;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("TRANSACTION ID", 40, y);
    ctx.font = "16px Arial, monospace";
    ctx.fillStyle = "#1a1a2e";
    ctx.fillText(transaction.transactionId, 40, y + 22);
    y += 60;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("DATE & TIME", 40, y);
    ctx.font = "16px Arial, sans-serif";
    ctx.fillStyle = "#333333";
    ctx.fillText(transaction.timestamp, 40, y + 22);
    y += 60;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("TRANSACTION TYPE", 40, y);
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillStyle = transaction.type === "deposit" ? "#27ae60" : 
                    transaction.type === "withdraw" ? "#e74c3c" : 
                    "#3498db";
    ctx.fillText(transaction.type.toUpperCase(), 40, y + 24);
    y += 70;

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    y += 30;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("FROM ACCOUNT", 40, y);
    ctx.font = "16px Arial, sans-serif";
    ctx.fillStyle = "#333333";
    ctx.fillText(senderData.name, 40, y + 22);
    ctx.font = "14px Arial, monospace";
    ctx.fillStyle = "#666666";
    ctx.fillText(transaction.fromAccount || "N/A", 40, y + 42);
    y += 80;

    if (receiverData) {
        ctx.font = "bold 14px Arial, sans-serif";
        ctx.fillStyle = "#666666";
        ctx.fillText("TO ACCOUNT", 40, y);
        ctx.font = "16px Arial, sans-serif";
        ctx.fillStyle = "#333333";
        ctx.fillText(receiverData.name, 40, y + 22);
        ctx.font = "14px Arial, monospace";
        ctx.fillStyle = "#666666";
        ctx.fillText(transaction.toAccount || "N/A", 40, y + 42);
        y += 80;
    }

    ctx.strokeStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    y += 40;

    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("AMOUNT", 40, y);
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.fillStyle = transaction.type === "deposit" ? "#27ae60" : 
                    transaction.type === "withdraw" ? "#e74c3c" : 
                    "#1a1a2e";
    const prefix = transaction.type === "deposit" ? "+" : "-";
    ctx.fillText(`${prefix}${CURRENCY_SYMBOL}${formatMoney(transaction.amount)}`, 40, y + 45);
    y += 90;

    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("NEW BALANCE", 40, y);
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillStyle = "#1a1a2e";
    ctx.fillText(`${CURRENCY_SYMBOL}${formatMoney(transaction.newBalance)}`, 40, y + 30);
    y += 80;

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, height - 100, width, 100);
    ctx.font = "12px Arial, sans-serif";
    ctx.fillStyle = "#999999";
    ctx.textAlign = "center";
    ctx.fillText("This is an official transaction receipt from " + BANK_NAME, width / 2, height - 60);
    ctx.fillText("Keep this receipt for your records", width / 2, height - 40);
    ctx.fillText("Customer Service: Available 24/7", width / 2, height - 20);

    const buffer = canvas.toBuffer("image/png");
    const outputPath = path.join(__dirname, "tmp", `receipt_${transaction.transactionId}.png`);
    await fs.ensureDir(path.join(__dirname, "tmp"));
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}

function generateTransactionId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
}

function ensureDataStructure(userData) {
    if (!userData.data) userData.data = {};
    if (!userData.data.bank) {
        userData.data.bank = null;
    }
    if (userData.data.bank && userData.data.bank.accountNumber && !userData.data.bank.isRegistered) {
        userData.data.bank.isRegistered = true;
    }
    return userData;
}

function isRegistered(userData) {
    if (!userData.data || !userData.data.bank) return false;
    if (userData.data.bank.isRegistered === true) return true;
    if (userData.data.bank.accountNumber && userData.data.bank.transactions && userData.data.bank.transactions.length > 0) {
        return true;
    }
    return false;
}

function createBankAccount(userData) {
    if (userData.data.bank && userData.data.bank.accountNumber) {
        return userData;
    }
    userData.data.bank = {
        isRegistered: true,
        accountNumber: generateAccountNumber(),
        balance: 0,
        savings: 0,
        transactions: [],
        cards: [],
        dailyWithdraw: { date: null, amount: 0 },
        dailyTransfer: { date: null, amount: 0 },
        createdAt: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
        lastInterest: null,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalTransferred: 0
    };
    return userData;
}

module.exports = {
    config: {
        name: "bank",
        aliases: ["atm", "banking"],
        version: "2.0",
        author: "Neoaz 🐦",
        countDown: 5,
        role: 0,
        description: "Complete banking system with ATM cards, transfers, savings accounts",
        category: "economy",
        guide: `{pn} - View bank menu
{pn} register - Register account
{pn} balance - Check balance  
{pn} deposit <amount> - Deposit money
{pn} withdraw <amount> - Withdraw money
{pn} transfer <@tag or UID> <amount> - Transfer money
{pn} history - Transaction history
{pn} card - View ATM card
{pn} card apply <standard/gold/platinum> - Apply for card
{pn} card activate - Activate card
{pn} card block - Block card
{pn} card pin <new PIN> - Change PIN
{pn} savings deposit <amount> - Deposit to savings
{pn} savings withdraw - Withdraw savings
{pn} statement - Account statement`
    },

    langs: {
        en: {
            menu: `
     🏦 ${BANK_NAME}     
══════════════════════
 📋 BANKING SERVICES:      
                          
 💰 deposit - Deposit     
 💸 withdraw - Withdraw   
 🔄 transfer - Transfer   
 📊 balance - Balance     
 📜 history - History     
 💳 card - ATM Card       
 🏧 savings - Savings     
 📑 statement - Statement`,
            notRegistered: "❌ You don't have a bank account!\nUse: bank register to sign up",
            alreadyRegistered: "✅ You already have a bank account!",
            registered: `🎉 REGISTRATION SUCCESSFUL!

🏦 ${BANK_NAME}
━━━━━━━━━━━━━━━━━
📋 Account No: %1
💰 Balance: ${CURRENCY_SYMBOL}0
📅 Opened: %2
━━━━━━━━━━━━━━━━━
Welcome to ${BANK_NAME}!`,
            balance: `💳 ACCOUNT INFORMATION

🏦 ${BANK_NAME}
━━━━━━━━━━━━━━━━━
👤 Holder: %1
📋 Account: %2
💰 Balance: ${CURRENCY_SYMBOL}%3
💎 Savings: ${CURRENCY_SYMBOL}%4
━━━━━━━━━━━━━━━━━
📊 Total Deposits: ${CURRENCY_SYMBOL}%5
📊 Total Withdrawals: ${CURRENCY_SYMBOL}%6`,
            depositSuccess: "✅ Deposit successful!",
            withdrawSuccess: "✅ Withdrawal successful!",
            transferSuccess: "✅ Transfer successful!",
            invalidAmount: "❌ Invalid amount!",
            insufficientBalance: "❌ Insufficient bank balance!",
            insufficientWallet: "❌ Insufficient wallet balance!",
            minDeposit: `❌ Minimum deposit is ${CURRENCY_SYMBOL}${MIN_DEPOSIT}`,
            minWithdraw: `❌ Minimum withdrawal is ${CURRENCY_SYMBOL}${MIN_WITHDRAW}`,
            minTransfer: `❌ Minimum transfer is ${CURRENCY_SYMBOL}${MIN_TRANSFER}`,
            dailyLimitReached: "❌ You've reached today's transaction limit!",
            noTransactions: "📭 No transactions yet!",
            noCard: "❌ You don't have an ATM card!\nUse: bank card apply <type>",
            cardApplied: "✅ Card application successful! Your PIN: %1",
            cardActivated: "✅ Card has been activated!",
            cardBlocked: "✅ Card has been blocked!",
            pinChanged: "✅ PIN changed successfully!",
            invalidPin: "❌ PIN must be 4 digits!",
            savingsDeposited: "✅ Savings deposit successful!",
            savingsWithdrawn: "✅ Savings withdrawal successful!",
            noSavings: "❌ You have no savings!"
        }
    },

    onStart: async function ({ args, message, event, usersData, getLang }) {
        const { senderID } = event;
        let userData = await usersData.get(senderID);
        const action = args[0]?.toLowerCase();

        if (!action) {
            return message.reply(getLang("menu"));
        }

        switch (action) {
            case "register": {
                userData = ensureDataStructure(userData);
                if (isRegistered(userData)) {
                    return message.reply(getLang("alreadyRegistered"));
                }
                userData = createBankAccount(userData);
                const transaction = {
                    transactionId: generateTransactionId(),
                    type: "account_opened",
                    amount: 0,
                    newBalance: 0,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: "Account opened"
                };
                userData.data.bank.transactions.push(transaction);
                await usersData.set(senderID, { data: userData.data });
                return message.reply(getLang("registered", userData.data.bank.accountNumber, userData.data.bank.createdAt));
            }

            case "balance":
            case "bal": {
                userData = ensureDataStructure(userData);
                if (!isRegistered(userData)) {
                    return message.reply(getLang("notRegistered"));
                }
                return message.reply(getLang("balance", 
                    userData.name,
                    userData.data.bank.accountNumber,
                    formatMoney(userData.data.bank.balance),
                    formatMoney(userData.data.bank.savings || 0),
                    formatMoney(userData.data.bank.totalDeposited || 0),
                    formatMoney(userData.data.bank.totalWithdrawn || 0)
                ));
            }

            case "deposit":
            case "dep": {
                userData = ensureDataStructure(userData);
                if (!isRegistered(userData)) {
                    return message.reply(getLang("notRegistered"));
                }
                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) {
                    return message.reply(getLang("invalidAmount"));
                }
                if (amount < MIN_DEPOSIT) {
                    return message.reply(getLang("minDeposit"));
                }
                if (userData.money < amount) {
                    return message.reply(getLang("insufficientWallet"));
                }

                const transaction = {
                    transactionId: generateTransactionId(),
                    type: "deposit",
                    amount: amount,
                    fromAccount: "Wallet",
                    newBalance: userData.data.bank.balance + amount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: "Wallet to Bank deposit"
                };

                userData.data.bank.balance += amount;
                userData.data.bank.totalDeposited = (userData.data.bank.totalDeposited || 0) + amount;
                userData.data.bank.transactions.unshift(transaction);
                if (userData.data.bank.transactions.length > 50) {
                    userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                }

                await usersData.set(senderID, {
                    money: userData.money - amount,
                    data: userData.data
                });

                const receiptPath = await createTransactionReceipt(transaction, userData);
                return message.reply({
                    body: `${getLang("depositSuccess")}

💰 Amount: ${CURRENCY_SYMBOL}${formatMoney(amount)}
💳 New Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}
🔖 Transaction ID: ${transaction.transactionId}`,
                    attachment: fs.createReadStream(receiptPath)
                }, () => fs.unlinkSync(receiptPath));
            }

            case "withdraw":
            case "wd": {
                userData = ensureDataStructure(userData);
                if (!isRegistered(userData)) {
                    return message.reply(getLang("notRegistered"));
                }
                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) {
                    return message.reply(getLang("invalidAmount"));
                }
                if (amount < MIN_WITHDRAW) {
                    return message.reply(getLang("minWithdraw"));
                }
                if (userData.data.bank.balance < amount) {
                    return message.reply(getLang("insufficientBalance"));
                }

                const today = moment().tz("Asia/Dhaka").format("DD/MM/YYYY");
                if (userData.data.bank.dailyWithdraw.date === today) {
                    if (userData.data.bank.dailyWithdraw.amount + amount > DAILY_WITHDRAW_LIMIT) {
                        return message.reply(`${getLang("dailyLimitReached")}\nRemaining: ${CURRENCY_SYMBOL}${formatMoney(DAILY_WITHDRAW_LIMIT - userData.data.bank.dailyWithdraw.amount)}`);
                    }
                    userData.data.bank.dailyWithdraw.amount += amount;
                } else {
                    userData.data.bank.dailyWithdraw = { date: today, amount: amount };
                }

                const transaction = {
                    transactionId: generateTransactionId(),
                    type: "withdraw",
                    amount: amount,
                    fromAccount: userData.data.bank.accountNumber,
                    newBalance: userData.data.bank.balance - amount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: "Bank to Wallet withdrawal"
                };

                userData.data.bank.balance -= amount;
                userData.data.bank.totalWithdrawn = (userData.data.bank.totalWithdrawn || 0) + amount;
                userData.data.bank.transactions.unshift(transaction);
                if (userData.data.bank.transactions.length > 50) {
                    userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                }

                await usersData.set(senderID, {
                    money: userData.money + amount,
                    data: userData.data
                });

                const receiptPath = await createTransactionReceipt(transaction, userData);
                return message.reply({
                    body: `${getLang("withdrawSuccess")}

💸 Amount: ${CURRENCY_SYMBOL}${formatMoney(amount)}
💳 Bank Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}
👛 Wallet Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.money + amount)}
🔖 Transaction ID: ${transaction.transactionId}`,
                    attachment: fs.createReadStream(receiptPath)
                }, () => fs.unlinkSync(receiptPath));
            }

            case "transfer":
            case "tf": {
                userData = ensureDataStructure(userData);
                if (!isRegistered(userData)) {
                    return message.reply(getLang("notRegistered"));
                }

                let targetID;
                let amount;

                if (Object.keys(event.mentions).length > 0) {
                    targetID = Object.keys(event.mentions)[0];
                    amount = parseInt(args[2]) || parseInt(args[1]);
                } else {
                    targetID = args[1];
                    amount = parseInt(args[2]);
                }

                if (!targetID || isNaN(amount) || amount <= 0) {
                    return message.reply("Usage: bank transfer <@user or UID> <amount>");
                }
                if (amount < MIN_TRANSFER) {
                    return message.reply(getLang("minTransfer"));
                }
                if (userData.data.bank.balance < amount) {
                    return message.reply(getLang("insufficientBalance"));
                }
                if (targetID == senderID) {
                    return message.reply("❌ You cannot transfer to yourself!");
                }

                const today = moment().tz("Asia/Dhaka").format("DD/MM/YYYY");
                if (userData.data.bank.dailyTransfer.date === today) {
                    if (userData.data.bank.dailyTransfer.amount + amount > DAILY_TRANSFER_LIMIT) {
                        return message.reply(`${getLang("dailyLimitReached")}\nRemaining: ${CURRENCY_SYMBOL}${formatMoney(DAILY_TRANSFER_LIMIT - userData.data.bank.dailyTransfer.amount)}`);
                    }
                    userData.data.bank.dailyTransfer.amount += amount;
                } else {
                    userData.data.bank.dailyTransfer = { date: today, amount: amount };
                }

                let targetData = await usersData.get(targetID);
                targetData = ensureDataStructure(targetData);
                if (!isRegistered(targetData)) {
                    return message.reply("❌ Recipient doesn't have a bank account!");
                }

                const transaction = {
                    transactionId: generateTransactionId(),
                    type: "transfer",
                    amount: amount,
                    fromAccount: userData.data.bank.accountNumber,
                    toAccount: targetData.data.bank.accountNumber,
                    newBalance: userData.data.bank.balance - amount,
                    timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                    description: `Transfer to ${targetData.name}`
                };

                const receiverTransaction = {
                    transactionId: transaction.transactionId,
                    type: "received",
                    amount: amount,
                    fromAccount: userData.data.bank.accountNumber,
                    toAccount: targetData.data.bank.accountNumber,
                    newBalance: targetData.data.bank.balance + amount,
                    timestamp: transaction.timestamp,
                    description: `Received from ${userData.name}`
                };

                userData.data.bank.balance -= amount;
                userData.data.bank.totalTransferred = (userData.data.bank.totalTransferred || 0) + amount;
                userData.data.bank.transactions.unshift(transaction);

                targetData.data.bank.balance += amount;
                targetData.data.bank.transactions.unshift(receiverTransaction);

                if (userData.data.bank.transactions.length > 50) {
                    userData.data.bank.transactions = userData.data.bank.transactions.slice(0, 50);
                }
                if (targetData.data.bank.transactions.length > 50) {
                    targetData.data.bank.transactions = targetData.data.bank.transactions.slice(0, 50);
                }

                await usersData.set(senderID, { data: userData.data });
                await usersData.set(targetID, { data: targetData.data });

                const receiptPath = await createTransactionReceipt(transaction, userData, targetData);
                return message.reply({
                    body: `${getLang("transferSuccess")}

🔄 TRANSFER DETAILS
━━━━━━━━━━━━━━━━━
📤 From: ${userData.name}
📥 To: ${targetData.name}
💰 Amount: ${CURRENCY_SYMBOL}${formatMoney(amount)}
💳 Your Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}
🔖 ID: ${transaction.transactionId}`,
                    attachment: fs.createReadStream(receiptPath)
                }, () => fs.unlinkSync(receiptPath));
            }

            case "history":
            case "his": {
                userData = ensureDataStructure(userData);
                if (!isRegistered(userData)) {
                    return message.reply(getLang("notRegistered"));
                }
                if (userData.data.bank.transactions.length === 0) {
                    return message.reply(getLang("noTransactions"));
                }

                const transactions = userData.data.bank.transactions.slice(0, 10);
                let historyMsg = `📜 TRANSACTION HISTORY\n━━━━━━━━━━━━━━━━━\n`;
                
                transactions.forEach((tx, i) => {
                    const icon = tx.type === "deposit" ? "💰" : 
                                tx.type === "withdraw" ? "💸" : 
                                tx.type === "transfer" ? "📤" : 
                                tx.type === "received" ? "📥" : "📋";
                    const sign = ["deposit", "received"].includes(tx.type) ? "+" : "-";
                    historyMsg += `${i + 1}. ${icon} ${tx.type.toUpperCase()}\n`;
                    historyMsg += `   ${sign}${CURRENCY_SYMBOL}${formatMoney(tx.amount)} | ${tx.timestamp.split(" ")[0]}\n`;
                });

                return message.reply(historyMsg);
            }

            case "card": {
                userData = ensureDataStructure(userData);
                if (!isRegistered(userData)) {
                    return message.reply(getLang("notRegistered"));
                }

                const cardAction = args[1]?.toLowerCase();

                if (!cardAction) {
                    if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) {
                        return message.reply(getLang("noCard"));
                    }
                    const card = userData.data.bank.cards[0];
                    const cardPath = await createBankCard(card, userData);
                    return message.reply({
                        body: `💳 YOUR ATM CARD
━━━━━━━━━━━━━━━━━
📋 Card No: ${formatCardNumber(card.cardNumber)}
📅 Expiry: ${card.expiryDate}
🔒 Status: ${card.isActive ? "Active ✅" : "Blocked ❌"}
💎 Type: ${card.cardType.toUpperCase()}
━━━━━━━━━━━━━━━━━
⚠️ CVV and PIN shown on card back`,
                        attachment: fs.createReadStream(cardPath)
                    }, () => fs.unlinkSync(cardPath));
                }

                switch (cardAction) {
                    case "apply": {
                        if (userData.data.bank.cards && userData.data.bank.cards.length > 0) {
                            return message.reply("❌ You already have a card!");
                        }
                        const cardType = args[2]?.toLowerCase() || "standard";
                        if (!["standard", "gold", "platinum"].includes(cardType)) {
                            return message.reply("❌ Card types: standard, gold, platinum");
                        }

                        const minBalance = cardType === "platinum" ? 50000 : cardType === "gold" ? 10000 : 0;
                        if (userData.data.bank.balance < minBalance) {
                            return message.reply(`❌ Minimum balance for ${cardType} card: ${CURRENCY_SYMBOL}${formatMoney(minBalance)}`);
                        }

                        const pin = generatePIN();
                        const newCard = {
                            cardNumber: generateCardNumber(),
                            cvv: generateCVV(),
                            pin: hashPIN(pin),
                            expiryDate: getExpiryDate(),
                            cardType: cardType,
                            isActive: true,
                            issuedAt: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                            accountNumber: userData.data.bank.accountNumber
                        };

                        userData.data.bank.cards = [newCard];
                        await usersData.set(senderID, { data: userData.data });

                        const cardPath = await createBankCard(newCard, userData);
                        return message.reply({
                            body: `${getLang("cardApplied", pin)}

💳 NEW CARD ISSUED
━━━━━━━━━━━━━━━━━
📋 Card No: ${formatCardNumber(newCard.cardNumber)}
📅 Expiry: ${newCard.expiryDate}
🔐 CVV: ${newCard.cvv}
🔑 PIN: ${pin}
💎 Type: ${cardType.toUpperCase()}
━━━━━━━━━━━━━━━━━
⚠️ Keep your PIN safe! Don't share it.`,
                            attachment: fs.createReadStream(cardPath)
                        }, () => fs.unlinkSync(cardPath));
                    }

                    case "activate": {
                        if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) {
                            return message.reply(getLang("noCard"));
                        }
                        userData.data.bank.cards[0].isActive = true;
                        await usersData.set(senderID, { data: userData.data });
                        return message.reply(getLang("cardActivated"));
                    }

                    case "block": {
                        if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) {
                            return message.reply(getLang("noCard"));
                        }
                        userData.data.bank.cards[0].isActive = false;
                        await usersData.set(senderID, { data: userData.data });
                        return message.reply(getLang("cardBlocked"));
                    }

                    case "pin": {
                        if (!userData.data.bank.cards || userData.data.bank.cards.length === 0) {
                            return message.reply(getLang("noCard"));
                        }
                        const newPin = args[2];
                        if (!newPin || !/^\d{4}$/.test(newPin)) {
                            return message.reply(getLang("invalidPin"));
                        }
                        userData.data.bank.cards[0].pin = hashPIN(newPin);
                        await usersData.set(senderID, { data: userData.data });
                        return message.reply(getLang("pinChanged"));
                    }

                    default:
                        return message.reply(`💳 Card Commands:
• card - View your card
• card apply <type> - Apply for card
• card activate - Activate card
• card block - Block card  
• card pin <4 digits> - Change PIN

Card Types: standard, gold, platinum`);
                }
            }

            case "savings":
            case "save": {
                userData = ensureDataStructure(userData);
                if (!isRegistered(userData)) {
                    return message.reply(getLang("notRegistered"));
                }

                const savingsAction = args[1]?.toLowerCase();

                if (!savingsAction) {
                    return message.reply(`🏧 SAVINGS ACCOUNT
━━━━━━━━━━━━━━━━━
💎 Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.savings || 0)}
📈 Interest Rate: ${INTEREST_RATE * 100}% daily
━━━━━━━━━━━━━━━━━
Commands:
• savings deposit <amount>
• savings withdraw`);
                }

                switch (savingsAction) {
                    case "deposit":
                    case "dep": {
                        const amount = parseInt(args[2]);
                        if (isNaN(amount) || amount <= 0) {
                            return message.reply(getLang("invalidAmount"));
                        }
                        if (userData.data.bank.balance < amount) {
                            return message.reply(getLang("insufficientBalance"));
                        }

                        userData.data.bank.balance -= amount;
                        userData.data.bank.savings = (userData.data.bank.savings || 0) + amount;
                        userData.data.bank.lastInterest = moment().tz("Asia/Dhaka").format("DD/MM/YYYY");

                        const transaction = {
                            transactionId: generateTransactionId(),
                            type: "savings_deposit",
                            amount: amount,
                            newBalance: userData.data.bank.balance,
                            timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                            description: "Transfer to Savings"
                        };
                        userData.data.bank.transactions.unshift(transaction);

                        await usersData.set(senderID, { data: userData.data });
                        return message.reply(`${getLang("savingsDeposited")}

💎 Savings Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.savings)}
💰 Bank Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}`);
                    }

                    case "withdraw":
                    case "wd": {
                        if (!userData.data.bank.savings || userData.data.bank.savings <= 0) {
                            return message.reply(getLang("noSavings"));
                        }

                        const lastInterest = userData.data.bank.lastInterest;
                        let interest = 0;
                        if (lastInterest) {
                            const days = moment().diff(moment(lastInterest, "DD/MM/YYYY"), "days");
                            interest = Math.floor(userData.data.bank.savings * INTEREST_RATE * days);
                        }

                        const total = userData.data.bank.savings + interest;
                        userData.data.bank.balance += total;
                        userData.data.bank.savings = 0;
                        userData.data.bank.lastInterest = null;

                        const transaction = {
                            transactionId: generateTransactionId(),
                            type: "savings_withdraw",
                            amount: total,
                            newBalance: userData.data.bank.balance,
                            timestamp: moment().tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss"),
                            description: `Savings withdrawal + ${CURRENCY_SYMBOL}${formatMoney(interest)} interest`
                        };
                        userData.data.bank.transactions.unshift(transaction);

                        await usersData.set(senderID, { data: userData.data });
                        return message.reply(`${getLang("savingsWithdrawn")}

💎 Withdrawn: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.savings)}
📈 Interest Earned: ${CURRENCY_SYMBOL}${formatMoney(interest)}
💰 Total Added: ${CURRENCY_SYMBOL}${formatMoney(total)}
💳 Bank Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}`);
                    }

                    default:
                        return message.reply(`🏧 Savings Commands:
• savings deposit <amount>
• savings withdraw`);
                }
            }

            case "statement":
            case "stmt": {
                userData = ensureDataStructure(userData);
                if (!isRegistered(userData)) {
                    return message.reply(getLang("notRegistered"));
                }

                let statementMsg = `📑 ACCOUNT STATEMENT
━━━━━━━━━━━━━━━━━━━━━
🏦 ${BANK_NAME}
👤 ${userData.name}
📋 ${userData.data.bank.accountNumber}
━━━━━━━━━━━━━━━━━━━━━

💰 Current Balance: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.balance)}
💎 Savings: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.savings || 0)}

📊 STATISTICS
━━━━━━━━━━━━━━━━━━━━━
📥 Total Deposited: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.totalDeposited || 0)}
📤 Total Withdrawn: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.totalWithdrawn || 0)}
🔄 Total Transferred: ${CURRENCY_SYMBOL}${formatMoney(userData.data.bank.totalTransferred || 0)}

💳 CARDS: ${userData.data.bank.cards?.length || 0}
📋 Transactions: ${userData.data.bank.transactions.length}

📅 Account Opened: ${userData.data.bank.createdAt}
━━━━━━━━━━━━━━━━━━━━━
Thank you for banking with us!`;

                return message.reply(statementMsg);
            }

            default:
                return message.reply(getLang("menu"));
        }
    }
};
