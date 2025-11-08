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
        console.log("[PREMIUMLIST] Canvas loaded successfully - cards will be generated");
} catch (err) {
        console.log("[PREMIUMLIST] Canvas not available - using text-only mode. Error:", err.message);
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

async function createPremiumListCard(premiumUsers, usersData) {
        if (!canvasAvailable || premiumUsers.length === 0) {
                return null;
        }

        try {
                const canvas = createCanvas(1600, 1400);
                const ctx = canvas.getContext("2d");

                roundRect(ctx, 0, 0, 1600, 1400, 40);
                ctx.clip();

                const bgGradient = ctx.createLinearGradient(0, 0, 1600, 1400);
                bgGradient.addColorStop(0, "#0D1117");
                bgGradient.addColorStop(0.3, "#161B22");
                bgGradient.addColorStop(0.7, "#1C2128");
                bgGradient.addColorStop(1, "#0D1117");
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, 1600, 1400);

                for (let i = 0; i < 40; i++) {
                        const x = Math.random() * 1600;
                        const y = Math.random() * 1400;
                        const radius = Math.random() * 150 + 80;
                        const starGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        starGradient.addColorStop(0, `rgba(59, 130, 246, ${Math.random() * 0.12})`);
                        starGradient.addColorStop(0.5, `rgba(139, 92, 246, ${Math.random() * 0.08})`);
                        starGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
                        ctx.fillStyle = starGradient;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                for (let i = 0; i < 50; i++) {
                        const x = Math.random() * 1600;
                        const y = Math.random() * 1400;
                        const radius = Math.random() * 1.5 + 0.5;
                        ctx.fillStyle = `rgba(167, 139, 250, ${Math.random() * 0.5 + 0.3})`;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
                ctx.shadowBlur = 40;
                roundRect(ctx, 25, 25, 1550, 1350, 35);
                const mainBorder = ctx.createLinearGradient(25, 25, 25, 1375);
                mainBorder.addColorStop(0, "rgba(59, 130, 246, 0.7)");
                mainBorder.addColorStop(0.5, "rgba(139, 92, 246, 0.7)");
                mainBorder.addColorStop(1, "rgba(236, 72, 153, 0.7)");
                ctx.strokeStyle = mainBorder;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;

                roundRect(ctx, 60, 60, 1480, 140, 25);
                const headerGradient = ctx.createLinearGradient(60, 60, 1540, 200);
                headerGradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
                headerGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.25)");
                headerGradient.addColorStop(1, "rgba(168, 85, 247, 0.25)");
                ctx.fillStyle = headerGradient;
                ctx.fill();
                const headerBorder = ctx.createLinearGradient(60, 60, 1540, 200);
                headerBorder.addColorStop(0, "rgba(59, 130, 246, 0.5)");
                headerBorder.addColorStop(1, "rgba(168, 85, 247, 0.5)");
                ctx.strokeStyle = headerBorder;
                ctx.lineWidth = 2;
                ctx.stroke();

                const titleGradient = ctx.createLinearGradient(0, 90, 1600, 160);
                titleGradient.addColorStop(0, "#3B82F6");
                titleGradient.addColorStop(0.3, "#8B5CF6");
                titleGradient.addColorStop(0.7, "#A855F7");
                titleGradient.addColorStop(1, "#3B82F6");
                ctx.fillStyle = titleGradient;
                ctx.font = "bold 80px Arial";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(59, 130, 246, 0.8)";
                ctx.shadowBlur = 20;
                ctx.fillText("PREMIUM USERS", 800, 155);
                ctx.shadowBlur = 0;

                let yOffset = 250;
                const itemHeight = 110;
                const maxDisplay = Math.min(premiumUsers.length, 10);

                for (let i = 0; i < maxDisplay; i++) {
                        const user = premiumUsers[i];
                        
                        roundRect(ctx, 80, yOffset, 1440, itemHeight, 20);
                        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                        ctx.shadowBlur = 15;
                        const itemGradient = ctx.createLinearGradient(80, yOffset, 1520, yOffset + itemHeight);
                        itemGradient.addColorStop(0, "rgba(30, 41, 59, 0.6)");
                        itemGradient.addColorStop(1, "rgba(15, 23, 42, 0.6)");
                        ctx.fillStyle = itemGradient;
                        ctx.fill();

                        const itemBorder = ctx.createLinearGradient(80, yOffset, 1520, yOffset);
                        itemBorder.addColorStop(0, "rgba(59, 130, 246, 0.5)");
                        itemBorder.addColorStop(0.5, "rgba(139, 92, 246, 0.5)");
                        itemBorder.addColorStop(1, "rgba(236, 72, 153, 0.5)");
                        ctx.strokeStyle = itemBorder;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.shadowBlur = 0;

                        let avatarImg;
                        try {
                                avatarImg = await loadImage(user.avatar);
                        } catch (err) {
                                const placeholderCanvas = createCanvas(90, 90);
                                const placeholderCtx = placeholderCanvas.getContext("2d");
                                placeholderCtx.fillStyle = "#1C2128";
                                placeholderCtx.fillRect(0, 0, 90, 90);
                                avatarImg = placeholderCanvas;
                        }

                        ctx.save();
                        ctx.shadowColor = "rgba(59, 130, 246, 0.7)";
                        ctx.shadowBlur = 30;
                        ctx.beginPath();
                        ctx.arc(140, yOffset + 55, 47, 0, Math.PI * 2);
                        ctx.closePath();
                        const avatarBorderGrad = ctx.createLinearGradient(93, yOffset, 187, yOffset + itemHeight);
                        avatarBorderGrad.addColorStop(0, "#3B82F6");
                        avatarBorderGrad.addColorStop(0.5, "#8B5CF6");
                        avatarBorderGrad.addColorStop(1, "#EC4899");
                        ctx.strokeStyle = avatarBorderGrad;
                        ctx.lineWidth = 5;
                        ctx.stroke();
                        ctx.shadowBlur = 0;

                        ctx.beginPath();
                        ctx.arc(140, yOffset + 55, 45, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        ctx.drawImage(avatarImg, 95, yOffset + 10, 90, 90);
                        ctx.restore();

                        ctx.font = "bold 42px Arial";
                        const nameGradient = ctx.createLinearGradient(210, yOffset + 30, 800, yOffset + 30);
                        nameGradient.addColorStop(0, "#60A5FA");
                        nameGradient.addColorStop(0.5, "#A78BFA");
                        nameGradient.addColorStop(1, "#F472B6");
                        ctx.fillStyle = nameGradient;
                        ctx.textAlign = "left";
                        ctx.shadowColor = "rgba(59, 130, 246, 0.8)";
                        ctx.shadowBlur = 20;
                        const displayName = user.name.length > 30 ? user.name.substring(0, 27) + "..." : user.name;
                        ctx.fillText(displayName, 210, yOffset + 50);
                        ctx.shadowBlur = 0;

                        ctx.font = "24px Arial";
                        const statusGradient = ctx.createLinearGradient(210, yOffset + 70, 500, yOffset + 70);
                        statusGradient.addColorStop(0, "#93C5FD");
                        statusGradient.addColorStop(0.5, "#C4B5FD");
                        statusGradient.addColorStop(1, "#F9A8D4");
                        ctx.fillStyle = statusGradient;
                        ctx.fillText(`Premium Member`, 210, yOffset + 80);

                        ctx.font = "bold 40px Arial";
                        const rankText = `#${i + 1}`;
                        const rankGradient = ctx.createLinearGradient(1350, yOffset + 20, 1450, yOffset + 80);
                        rankGradient.addColorStop(0, "#60A5FA");
                        rankGradient.addColorStop(1, "#A78BFA");
                        ctx.fillStyle = rankGradient;
                        ctx.textAlign = "right";
                        ctx.shadowColor = "rgba(59, 130, 246, 0.8)";
                        ctx.shadowBlur = 15;
                        ctx.fillText(rankText, 1480, yOffset + 65);
                        ctx.shadowBlur = 0;

                        yOffset += itemHeight + 12;
                }

                ctx.font = "italic 18px Arial";
                const footerGradient = ctx.createLinearGradient(0, 1350, 1600, 1350);
                footerGradient.addColorStop(0, "rgba(59, 130, 246, 0.7)");
                footerGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.7)");
                footerGradient.addColorStop(1, "rgba(236, 72, 153, 0.7)");
                ctx.fillStyle = footerGradient;
                ctx.textAlign = "center";
                ctx.fillText("Powered by NeoKEX", 800, 1350);

                const buffer = canvas.toBuffer();
                const tempPath = `./tmp/premium_list_${Date.now()}.png`;
                await fs.outputFile(tempPath, buffer);
                return fs.createReadStream(tempPath);
        } catch (error) {
                console.error("Premium list card generation error:", error.message);
                return null;
        }
}

module.exports = {
        config: {
                name: "premiumlist",
                version: "2.0.0",
                author: "NeoKEX",
                countDown: 10,
                role: 2,
                description: {
                        vi: "Quản lý danh sách người dùng premium",
                        en: "Manage premium users list"
                },
                category: "admin",
                guide: {
                        en: "   {pn} - View premium users list with premium card"
                                + "\n   {pn} add <@tag|userID> - Add user to premium list (admin only)"
                                + "\n   {pn} remove <@tag|userID> - Remove user from premium list (admin only)"
                                + "\n   {pn} list - View text list of all premium users"
                }
        },

        langs: {
                en: {
                        added: "Added %1 to premium users list!\nUser ID: %2\nTotal Premium Users: %3",
                        removed: "Removed %1 from premium users list!\nUser ID: %2\nRemaining Premium Users: %3",
                        alreadyPremium: "%1 is already a premium user!",
                        notPremium: "%1 is not a premium user!",
                        noPremiumUsers: "No premium users found. Use {pn} add @user to add premium users.",
                        needTarget: "Please mention a user or provide user ID!\n\nUsage:\n- {pn} add @user\n- {pn} add <userID>",
                        premiumListText: "Premium Users List (%1 users):\n\n%2",
                        errorLoading: "Error loading user data. Please try again."
                }
        },

        onStart: async function ({ args, message, event, usersData, getLang, commandName, api }) {
                const { senderID, threadID } = event;
                const action = args[0]?.toLowerCase();

                const config = global.GoatBot.config;
                if (!config.premiumUsers) {
                        config.premiumUsers = [];
                }

                switch (action) {
                        case "add": {
                                let targetID = Object.keys(event.mentions)[0];
                                if (!targetID && args[1]) {
                                        targetID = args[1];
                                }
                                if (!targetID) {
                                        return message.reply(getLang("needTarget").replace(/{pn}/g, global.utils.getPrefix(threadID) + commandName));
                                }

                                if (config.premiumUsers.includes(targetID)) {
                                        const targetData = await usersData.get(targetID);
                                        return message.reply(getLang("alreadyPremium", targetData.name));
                                }

                                config.premiumUsers.push(targetID);
                                await fs.writeJSON("./config.json", config, { spaces: 2 });
                                
                                const targetData = await usersData.get(targetID);
                                return message.reply(getLang("added", targetData.name, targetID, config.premiumUsers.length));
                        }

                        case "remove": {
                                let targetID = Object.keys(event.mentions)[0];
                                if (!targetID && args[1]) {
                                        targetID = args[1];
                                }
                                if (!targetID) {
                                        return message.reply(getLang("needTarget").replace(/{pn}/g, global.utils.getPrefix(threadID) + commandName));
                                }

                                const index = config.premiumUsers.indexOf(targetID);
                                if (index === -1) {
                                        const targetData = await usersData.get(targetID);
                                        return message.reply(getLang("notPremium", targetData.name));
                                }

                                config.premiumUsers.splice(index, 1);
                                await fs.writeJSON("./config.json", config, { spaces: 2 });
                                
                                const targetData = await usersData.get(targetID);
                                return message.reply(getLang("removed", targetData.name, targetID, config.premiumUsers.length));
                        }

                        case "list": {
                                if (config.premiumUsers.length === 0) {
                                        return message.reply(getLang("noPremiumUsers").replace(/{pn}/g, global.utils.getPrefix(threadID) + commandName));
                                }

                                let msg = "";
                                for (let i = 0; i < config.premiumUsers.length; i++) {
                                        try {
                                                const userData = await usersData.get(config.premiumUsers[i]);
                                                msg += `${i + 1}. ${userData.name} (${config.premiumUsers[i]})\n`;
                                        } catch (err) {
                                                msg += `${i + 1}. Unknown User (${config.premiumUsers[i]})\n`;
                                        }
                                }
                                return message.reply(getLang("premiumListText", config.premiumUsers.length, msg));
                        }

                        default: {
                                if (config.premiumUsers.length === 0) {
                                        return message.reply(getLang("noPremiumUsers").replace(/{pn}/g, global.utils.getPrefix(threadID) + commandName));
                                }

                                try {
                                        const premiumUsersData = [];
                                        for (const userID of config.premiumUsers.slice(0, 10)) {
                                                try {
                                                        const userData = await usersData.get(userID);
                                                        const avatar = await usersData.getAvatarUrl(userID);
                                                        premiumUsersData.push({
                                                                userID,
                                                                name: userData.name,
                                                                avatar
                                                        });
                                                } catch (err) {
                                                        console.log(`Failed to load data for user ${userID}:`, err.message);
                                                }
                                        }

                                        if (premiumUsersData.length === 0) {
                                                return message.reply(getLang("errorLoading"));
                                        }

                                        const cardImage = await createPremiumListCard(premiumUsersData, usersData);
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
                                        for (let i = 0; i < premiumUsersData.length; i++) {
                                                msg += `${i + 1}. ${premiumUsersData[i].name}\n`;
                                        }
                                        return message.reply(getLang("premiumListText", config.premiumUsers.length, msg));
                                } catch (err) {
                                        console.error("Premium list error:", err);
                                        return message.reply(getLang("errorLoading"));
                                }
                        }
                }
        }
};
