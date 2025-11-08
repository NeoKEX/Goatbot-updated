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
        console.log("✅ [TOP] Canvas loaded successfully - cards will be generated");
} catch (err) {
        console.log("❌ [TOP] Canvas not available - using text-only mode. Error:", err.message);
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

async function createTopLeaderboardCard(topUsers) {
        if (!canvasAvailable || topUsers.length === 0) {
                return null;
        }

        try {
                const canvas = createCanvas(1700, 1600);
                const ctx = canvas.getContext("2d");

                roundRect(ctx, 0, 0, 1700, 1600, 40);
                ctx.clip();

                const bgGradient = ctx.createLinearGradient(0, 0, 1700, 1600);
                bgGradient.addColorStop(0, "#0a0e27");
                bgGradient.addColorStop(0.3, "#1a1f3a");
                bgGradient.addColorStop(0.7, "#2a2f4a");
                bgGradient.addColorStop(1, "#0a0e27");
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, 1700, 1600);

                for (let i = 0; i < 50; i++) {
                        const x = Math.random() * 1700;
                        const y = Math.random() * 1600;
                        const radius = Math.random() * 140 + 70;
                        const starGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        starGradient.addColorStop(0, `rgba(255, 215, 0, ${Math.random() * 0.15})`);
                        starGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
                        ctx.fillStyle = starGradient;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
                ctx.shadowBlur = 70;
                roundRect(ctx, 25, 25, 1650, 1550, 38);
                ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
                ctx.lineWidth = 6;
                ctx.stroke();
                ctx.shadowBlur = 0;

                roundRect(ctx, 60, 60, 1580, 150, 28);
                const headerGradient = ctx.createLinearGradient(60, 60, 60, 210);
                headerGradient.addColorStop(0, "rgba(255, 215, 0, 0.35)");
                headerGradient.addColorStop(1, "rgba(255, 215, 0, 0.12)");
                ctx.fillStyle = headerGradient;
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
                ctx.lineWidth = 3;
                ctx.stroke();

                const titleGradient = ctx.createLinearGradient(0, 90, 0, 180);
                titleGradient.addColorStop(0, "#FFD700");
                titleGradient.addColorStop(0.5, "#FFA500");
                titleGradient.addColorStop(1, "#FFD700");
                ctx.fillStyle = titleGradient;
                ctx.font = "bold 90px Arial";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
                ctx.shadowBlur = 18;
                ctx.fillText("💰 TOP RICHEST USERS 💰", 850, 165);
                ctx.shadowBlur = 0;

                if (topUsers.length >= 1) {
                        const podiumY = 280;
                        const podiumWidth = 480;
                        const centerX = 850;

                        const positions = [
                                { rank: 1, x: centerX - podiumWidth / 2, height: 280, y: podiumY, color: "#FFD700", medal: "🥇" },
                                { rank: 2, x: centerX - podiumWidth - 80, height: 220, y: podiumY + 60, color: "#C0C0C0", medal: "🥈" },
                                { rank: 3, x: centerX + podiumWidth / 2 + 80, height: 180, y: podiumY + 100, color: "#CD7F32", medal: "🥉" }
                        ];

                        for (let i = 0; i < Math.min(3, topUsers.length); i++) {
                                const pos = positions[i];
                                const user = topUsers[i];

                                roundRect(ctx, pos.x, pos.y + (280 - pos.height), podiumWidth, pos.height, 20);
                                const podiumGradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + pos.height);
                                podiumGradient.addColorStop(0, pos.color);
                                podiumGradient.addColorStop(1, pos.color + "80");
                                ctx.fillStyle = podiumGradient;
                                ctx.fill();
                                ctx.strokeStyle = pos.color;
                                ctx.lineWidth = 4;
                                ctx.stroke();

                                let avatarImg;
                                try {
                                        avatarImg = await loadImage(user.avatar);
                                } catch (err) {
                                        const placeholderCanvas = createCanvas(140, 140);
                                        const placeholderCtx = placeholderCanvas.getContext("2d");
                                        placeholderCtx.fillStyle = pos.color;
                                        placeholderCtx.fillRect(0, 0, 140, 140);
                                        avatarImg = placeholderCanvas;
                                }

                                const avatarX = pos.x + podiumWidth / 2;
                                const avatarY = pos.y + (280 - pos.height) - 80;

                                ctx.save();
                                ctx.beginPath();
                                ctx.arc(avatarX, avatarY, 70, 0, Math.PI * 2);
                                ctx.closePath();
                                ctx.clip();
                                ctx.drawImage(avatarImg, avatarX - 70, avatarY - 70, 140, 140);
                                ctx.restore();

                                ctx.strokeStyle = pos.color;
                                ctx.lineWidth = 6;
                                ctx.beginPath();
                                ctx.arc(avatarX, avatarY, 73, 0, Math.PI * 2);
                                ctx.stroke();

                                ctx.fillStyle = "#FFFFFF";
                                ctx.font = "bold 60px Arial";
                                ctx.textAlign = "center";
                                ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                                ctx.shadowBlur = 12;
                                ctx.fillText(pos.medal, avatarX + 55, avatarY - 40);

                                ctx.font = "bold 38px Arial";
                                ctx.fillStyle = "#FFFFFF";
                                const nameY = pos.y + (280 - pos.height) + 35;
                                const displayName = user.name.length > 18 ? user.name.substring(0, 15) + "..." : user.name;
                                ctx.fillText(displayName, avatarX, nameY);

                                ctx.font = "bold 52px Arial";
                                const balanceGradient = ctx.createLinearGradient(avatarX - 100, nameY + 30, avatarX + 100, nameY + 70);
                                balanceGradient.addColorStop(0, "#FFD700");
                                balanceGradient.addColorStop(0.5, "#FFA500");
                                balanceGradient.addColorStop(1, "#FFD700");
                                ctx.fillStyle = balanceGradient;
                                ctx.fillText(`$${user.balance.toLocaleString()}`, avatarX, nameY + 60);

                                ctx.font = "bold 70px Arial";
                                ctx.fillStyle = pos.color;
                                ctx.fillText(`#${i + 1}`, avatarX, pos.y + pos.height - 30);
                                ctx.shadowBlur = 0;
                        }
                }

                let yOffset = 650;
                const itemHeight = 95;
                const startRank = Math.min(3, topUsers.length);

                for (let i = startRank; i < Math.min(10, topUsers.length); i++) {
                        const user = topUsers[i];

                        roundRect(ctx, 80, yOffset, 1540, itemHeight, 18);
                        const itemGradient = ctx.createLinearGradient(80, yOffset, 80, yOffset + itemHeight);
                        itemGradient.addColorStop(0, "rgba(255, 215, 0, 0.12)");
                        itemGradient.addColorStop(1, "rgba(255, 215, 0, 0.05)");
                        ctx.fillStyle = itemGradient;
                        ctx.fill();
                        ctx.strokeStyle = "rgba(255, 215, 0, 0.35)";
                        ctx.lineWidth = 2.5;
                        ctx.stroke();

                        let avatarImg;
                        try {
                                avatarImg = await loadImage(user.avatar);
                        } catch (err) {
                                const placeholderCanvas = createCanvas(75, 75);
                                const placeholderCtx = placeholderCanvas.getContext("2d");
                                placeholderCtx.fillStyle = "#FFD700";
                                placeholderCtx.fillRect(0, 0, 75, 75);
                                avatarImg = placeholderCanvas;
                        }

                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(135, yOffset + itemHeight / 2, 37, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        ctx.drawImage(avatarImg, 98, yOffset + (itemHeight - 75) / 2, 75, 75);
                        ctx.restore();

                        ctx.strokeStyle = "#FFD700";
                        ctx.lineWidth = 3.5;
                        ctx.beginPath();
                        ctx.arc(135, yOffset + itemHeight / 2, 39, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.font = "bold 42px Arial";
                        const rankGradient = ctx.createLinearGradient(190, yOffset, 250, yOffset + itemHeight);
                        rankGradient.addColorStop(0, "#FFD700");
                        rankGradient.addColorStop(1, "#FFA500");
                        ctx.fillStyle = rankGradient;
                        ctx.textAlign = "left";
                        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                        ctx.shadowBlur = 8;
                        ctx.fillText(`#${i + 1}`, 190, yOffset + itemHeight / 2 + 15);

                        ctx.font = "bold 38px Arial";
                        ctx.fillStyle = "#FFFFFF";
                        const displayName = user.name.length > 35 ? user.name.substring(0, 32) + "..." : user.name;
                        ctx.fillText(displayName, 280, yOffset + itemHeight / 2 + 15);

                        ctx.font = "bold 44px Arial";
                        const balanceText = `$${user.balance.toLocaleString()}`;
                        const balanceGradient = ctx.createLinearGradient(1300, yOffset, 1580, yOffset + itemHeight);
                        balanceGradient.addColorStop(0, "#FFD700");
                        balanceGradient.addColorStop(0.5, "#FFA500");
                        balanceGradient.addColorStop(1, "#FFD700");
                        ctx.fillStyle = balanceGradient;
                        ctx.textAlign = "right";
                        ctx.fillText(balanceText, 1580, yOffset + itemHeight / 2 + 15);
                        ctx.shadowBlur = 0;

                        yOffset += itemHeight + 10;
                }

                ctx.font = "italic 24px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.textAlign = "center";
                const footer = Buffer.from("UG93ZXJlZCBieSBOZW9LRVg=", "base64").toString();
                ctx.fillText(`💎 ${footer} Leaderboard System 💎`, 850, 1550);

                const buffer = canvas.toBuffer();
                const tempPath = `./tmp/top_leaderboard_${Date.now()}.png`;
                await fs.outputFile(tempPath, buffer);
                return fs.createReadStream(tempPath);
        } catch (error) {
                console.error("Top leaderboard card generation error:", error.message);
                return null;
        }
}

module.exports = {
        config: {
                name: "top",
                version: "2.0.0",
                author: "NeoKEX",
                countDown: 10,
                role: 0,
                description: {
                        vi: "Xem top 10 người dùng giàu nhất",
                        en: "View top 10 richest users"
                },
                category: "economy",
                guide: {
                        en: "   {pn} - View top 10 richest users with premium leaderboard card"
                                + "\n   {pn} list - View text list of top users"
                }
        },

        langs: {
                en: {
                        topList: "💰 TOP 10 RICHEST USERS 💰\n\n%1",
                        noData: "❌ No bank data found. Users need to register at the bank first!",
                        errorLoading: "❌ Error loading leaderboard data. Please try again."
                }
        },

        onStart: async function ({ args, message, event, usersData, getLang, api }) {
                const { threadID } = event;
                const action = args[0]?.toLowerCase();

                try {
                        const allUsers = await usersData.getAll();
                        const usersWithBank = allUsers.filter(user => user.data?.bank?.balance > 0);

                        if (usersWithBank.length === 0) {
                                return message.reply(getLang("noData"));
                        }

                        usersWithBank.sort((a, b) => b.data.bank.balance - a.data.bank.balance);
                        const top10 = usersWithBank.slice(0, 10);

                        if (action === "list") {
                                let msg = "";
                                for (let i = 0; i < top10.length; i++) {
                                        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "💰";
                                        msg += `${medal} ${i + 1}. ${top10[i].name} - $${top10[i].data.bank.balance.toLocaleString()}\n`;
                                }
                                return message.reply(getLang("topList", msg));
                        }

                        const topUsersData = [];
                        for (const user of top10) {
                                try {
                                        const avatar = await usersData.getAvatarUrl(user.userID);
                                        topUsersData.push({
                                                userID: user.userID,
                                                name: user.name,
                                                balance: user.data.bank.balance,
                                                avatar
                                        });
                                } catch (err) {
                                        console.log(`Failed to load avatar for user ${user.userID}:`, err.message);
                                }
                        }

                        if (topUsersData.length === 0) {
                                return message.reply(getLang("errorLoading"));
                        }

                        const cardImage = await createTopLeaderboardCard(topUsersData);
                        if (cardImage) {
                                const tempPath = cardImage.path;
                                cardImage.on('end', () => {
                                        fs.unlink(tempPath).catch(() => {});
                                });
                                return message.reply({
                                        attachment: cardImage
                                });
                        }

                        let msg = "";
                        for (let i = 0; i < topUsersData.length; i++) {
                                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "💰";
                                msg += `${medal} ${i + 1}. ${topUsersData[i].name} - $${topUsersData[i].balance.toLocaleString()}\n`;
                        }
                        return message.reply(getLang("topList", msg));
                } catch (err) {
                        console.error("Top leaderboard error:", err);
                        return message.reply(getLang("errorLoading"));
                }
        }
};
