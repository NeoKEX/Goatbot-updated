const fs = require("fs-extra");
const axios = require("axios");

let createCanvas, loadImage;
let canvasAvailable = false;
try {
        const canvas = require("canvas");
        createCanvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
        canvasAvailable = true;
} catch (err) {
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

async function createSpyCard(userData, userID, avatarUrl, exp, level, rank, userInfo = null) {
        if (!canvasAvailable) {
                return null;
        }

        try {
                const canvas = createCanvas(1300, 950);
                const ctx = canvas.getContext("2d");

                roundRect(ctx, 0, 0, 1300, 950, 35);
                ctx.clip();

                const gradient = ctx.createLinearGradient(0, 0, 1300, 950);
                gradient.addColorStop(0, "#0D1117");
                gradient.addColorStop(0.3, "#161B22");
                gradient.addColorStop(0.7, "#1C2128");
                gradient.addColorStop(1, "#0D1117");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1300, 950);

                for (let i = 0; i < 40; i++) {
                        const x = Math.random() * 1300;
                        const y = Math.random() * 950;
                        const radius = Math.random() * 150 + 80;
                        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        innerGradient.addColorStop(0, `rgba(59, 130, 246, ${Math.random() * 0.12})`);
                        innerGradient.addColorStop(0.5, `rgba(139, 92, 246, ${Math.random() * 0.08})`);
                        innerGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
                        ctx.fillStyle = innerGradient;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                for (let i = 0; i < 50; i++) {
                        const x = Math.random() * 1300;
                        const y = Math.random() * 950;
                        const radius = Math.random() * 1.5 + 0.5;
                        ctx.fillStyle = `rgba(167, 139, 250, ${Math.random() * 0.5 + 0.3})`;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
                ctx.shadowBlur = 40;
                roundRect(ctx, 20, 20, 1260, 910, 30);
                const mainBorder = ctx.createLinearGradient(20, 20, 20, 930);
                mainBorder.addColorStop(0, "rgba(59, 130, 246, 0.7)");
                mainBorder.addColorStop(0.5, "rgba(139, 92, 246, 0.7)");
                mainBorder.addColorStop(1, "rgba(236, 72, 153, 0.7)");
                ctx.strokeStyle = mainBorder;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;

                roundRect(ctx, 40, 40, 1220, 110, 15);
                const headerGradient = ctx.createLinearGradient(40, 40, 1260, 150);
                headerGradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
                headerGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.25)");
                headerGradient.addColorStop(1, "rgba(168, 85, 247, 0.25)");
                ctx.fillStyle = headerGradient;
                ctx.fill();
                const headerBorder = ctx.createLinearGradient(40, 40, 1260, 150);
                headerBorder.addColorStop(0, "rgba(59, 130, 246, 0.5)");
                headerBorder.addColorStop(1, "rgba(168, 85, 247, 0.5)");
                ctx.strokeStyle = headerBorder;
                ctx.lineWidth = 2;
                ctx.stroke();

                const titleGradient = ctx.createLinearGradient(0, 80, 1300, 120);
                titleGradient.addColorStop(0, "#3B82F6");
                titleGradient.addColorStop(0.3, "#8B5CF6");
                titleGradient.addColorStop(0.7, "#A855F7");
                titleGradient.addColorStop(1, "#3B82F6");
                ctx.fillStyle = titleGradient;
                ctx.font = "bold 56px Arial";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(59, 130, 246, 0.8)";
                ctx.shadowBlur = 20;
                ctx.fillText("USER PROFILE", 650, 115);
                ctx.shadowBlur = 0;

                const avatarSize = 180;
                const avatarX = 650 - avatarSize / 2;
                const avatarY = 190;

                try {
                        const avatar = await loadImage(avatarUrl);

                        ctx.save();
                        ctx.shadowColor = "rgba(59, 130, 246, 0.7)";
                        ctx.shadowBlur = 30;
                        ctx.beginPath();
                        ctx.arc(650, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
                        ctx.closePath();
                        const avatarBorderGrad = ctx.createLinearGradient(0, avatarY, 0, avatarY + avatarSize);
                        avatarBorderGrad.addColorStop(0, "#3B82F6");
                        avatarBorderGrad.addColorStop(0.5, "#8B5CF6");
                        avatarBorderGrad.addColorStop(1, "#EC4899");
                        ctx.strokeStyle = avatarBorderGrad;
                        ctx.lineWidth = 5;
                        ctx.stroke();
                        ctx.shadowBlur = 0;

                        ctx.beginPath();
                        ctx.arc(650, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                        ctx.restore();
                } catch (err) {
                }

                const nameGradient = ctx.createLinearGradient(200, 400, 1100, 400);
                nameGradient.addColorStop(0, "#60A5FA");
                nameGradient.addColorStop(0.3, "#A78BFA");
                nameGradient.addColorStop(0.7, "#F472B6");
                nameGradient.addColorStop(1, "#60A5FA");
                ctx.fillStyle = nameGradient;
                ctx.font = "bold 48px Arial";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(59, 130, 246, 0.8)";
                ctx.shadowBlur = 20;
                const displayName = userData.name.length > 28 ? userData.name.substring(0, 25) + "..." : userData.name;
                ctx.fillText(displayName, 650, 425);
                ctx.shadowBlur = 0;

                const levelRankGradient = ctx.createLinearGradient(400, 460, 900, 460);
                levelRankGradient.addColorStop(0, "#93C5FD");
                levelRankGradient.addColorStop(0.5, "#C4B5FD");
                levelRankGradient.addColorStop(1, "#F9A8D4");
                ctx.fillStyle = levelRankGradient;
                ctx.font = "24px Arial";
                ctx.fillText(`Level ${level} • Rank ${rank}`, 650, 460);

                const genderDisplay = userInfo?.gender ? (
                        typeof userInfo.gender === 'string' 
                                ? userInfo.gender.charAt(0).toUpperCase() + userInfo.gender.slice(1).toLowerCase()
                                : userInfo.gender === 1 ? "Female" : userInfo.gender === 2 ? "Male" : "Other"
                ) : "Unknown";

                let birthdayDisplay = "Not Available";
                if (userInfo?.isBirthday) {
                        birthdayDisplay = "◈ Today!";
                } else if (userInfo?.birthday) {
                        birthdayDisplay = userInfo.birthday;
                }

                const stats = [
                        { label: "User ID", value: userID.length > 18 ? userID.substring(0, 15) + "..." : userID, icon: "ID" },
                        { label: "Experience", value: `${exp.toLocaleString()} XP`, icon: "★" },
                        { label: "Wallet", value: `$${userData.money?.toLocaleString() || 0}`, icon: "$" },
                        { label: "Bank", value: `$${userData.data?.bank?.balance?.toLocaleString() || 0}`, icon: "⊕" },
                        { label: "Gender", value: genderDisplay, icon: "⚧" },
                        { label: "Birthday", value: birthdayDisplay, icon: "◈" }
                ];

                let yPos = 500;
                const boxSpacing = 75;
                const boxesPerRow = 2;

                stats.forEach((stat, index) => {
                        const row = Math.floor(index / boxesPerRow);
                        const col = index % boxesPerRow;

                        const boxWidth = 580;
                        const boxHeight = 65;
                        const boxX = 70 + (col * (boxWidth + 40));
                        const boxY = yPos + (row * boxSpacing);

                        roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
                        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                        ctx.shadowBlur = 15;
                        const boxGradient = ctx.createLinearGradient(boxX, boxY, boxX + boxWidth, boxY + boxHeight);
                        boxGradient.addColorStop(0, "rgba(30, 41, 59, 0.6)");
                        boxGradient.addColorStop(1, "rgba(15, 23, 42, 0.6)");
                        ctx.fillStyle = boxGradient;
                        ctx.fill();

                        const boxBorder = ctx.createLinearGradient(boxX, boxY, boxX + boxWidth, boxY);
                        boxBorder.addColorStop(0, "rgba(59, 130, 246, 0.5)");
                        boxBorder.addColorStop(0.5, "rgba(139, 92, 246, 0.5)");
                        boxBorder.addColorStop(1, "rgba(236, 72, 153, 0.5)");
                        ctx.strokeStyle = boxBorder;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.shadowBlur = 0;

                        ctx.font = "bold 18px Arial";
                        const labelGradient = ctx.createLinearGradient(boxX, boxY, boxX + 200, boxY);
                        labelGradient.addColorStop(0, "#60A5FA");
                        labelGradient.addColorStop(1, "#A78BFA");
                        ctx.fillStyle = labelGradient;
                        ctx.textAlign = "left";
                        ctx.fillText(`${stat.icon} ${stat.label}`, boxX + 25, boxY + 30);

                        ctx.font = "bold 26px Arial";
                        ctx.fillStyle = "#E0E7FF";
                        ctx.textAlign = "right";
                        const valueText = stat.value.length > 26 ? stat.value.substring(0, 23) + "..." : stat.value;
                        ctx.fillText(valueText, boxX + boxWidth - 25, boxY + 48);
                });

                ctx.font = "italic 18px Arial";
                const footerGradient = ctx.createLinearGradient(0, 920, 1300, 920);
                footerGradient.addColorStop(0, "rgba(59, 130, 246, 0.7)");
                footerGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.7)");
                footerGradient.addColorStop(1, "rgba(236, 72, 153, 0.7)");
                ctx.fillStyle = footerGradient;
                ctx.textAlign = "center";
                ctx.fillText("Powered by NeoKEX", 650, 920);

                const buffer = canvas.toBuffer();
                const tempPath = `./tmp/spy_card_${Date.now()}.png`;
                await fs.outputFile(tempPath, buffer);
                return fs.createReadStream(tempPath);
        } catch (error) {
                throw error;
        }
}

module.exports = {
        config: {
                name: "spy",
                version: "1.0.0",
                author: "NeoKEX",
                countDown: 10,
                role: 0,
                description: {
                        en: "Spy on a user to view their detailed information and stats"
                },
                category: "info",
                guide: {
                        en: "   {pn} [@mention] - Spy on mentioned user\n"
                                + "   {pn} [userID] - Spy on user by ID\n"
                                + "   {pn} - Spy on yourself\n"
                                + "   Reply to someone's message with {pn} to spy on them"
                }
        },

        langs: {
                en: {
                        userInfo: "▣ User Intelligence Report\n\n"
                                + "⚧ Name: %1\n"
                                + "ID User ID: %2\n"
                                + "★ Level: %3\n"
                                + "♛ Rank: %4\n"
                                + "◆ Experience: %5 XP\n"
                                + "$ Money: $%6\n"
                                + "⊕ Bank Balance: $%7",
                        userNotFound: "✖ User not found in database!"
                }
        },

        onStart: async function ({ args, message, event, usersData, getLang, api }) {
                const { senderID } = event;

                let targetID = senderID;

                if (event.messageReply) {
                        targetID = event.messageReply.senderID;
                } else if (Object.keys(event.mentions).length > 0) {
                        targetID = Object.keys(event.mentions)[0];
                } else if (args[0]) {
                        targetID = args[0];
                }

                try {
                        const userData = await usersData.get(targetID);

                        if (!userData) {
                                return message.reply(getLang("userNotFound"));
                        }

                        const exp = userData.exp || 0;
                        const deltaNext = 5;
                        const level = Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);

                        const allUser = await usersData.getAll();
                        allUser.sort((a, b) => b.exp - a.exp);
                        const rank = allUser.findIndex(user => user.userID == targetID) + 1;
                        const rankText = `#${rank}/${allUser.length}`;

                        const avatarUrl = await usersData.getAvatarUrl(targetID);

                        let userInfo = null;
                        try {
                                const fbUserInfo = await api.getUserInfo(targetID);
                                userInfo = fbUserInfo[targetID];
                        } catch (err) {
                        }

                        try {
                                const cardImage = await createSpyCard(
                                        userData,
                                        targetID,
                                        avatarUrl,
                                        exp,
                                        level,
                                        rankText,
                                        userInfo
                                );

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
                        }

                        let extraInfo = "";
                        if (userInfo) {
                                const gender = userInfo.gender ? (
                                        typeof userInfo.gender === 'string' 
                                                ? userInfo.gender.charAt(0).toUpperCase() + userInfo.gender.slice(1).toLowerCase()
                                                : userInfo.gender === 1 ? "Female" : userInfo.gender === 2 ? "Male" : "Other"
                                ) : "Unknown";

                                let birthday = "Not Available";
                                if (userInfo.isBirthday) {
                                        birthday = "◈ Today!";
                                } else if (userInfo.birthday) {
                                        birthday = userInfo.birthday;
                                }

                                extraInfo = `\n⚧ Gender: ${gender}\n◈ Birthday: ${birthday}`;
                        }

                        return message.reply(getLang("userInfo",
                                userData.name,
                                targetID,
                                level,
                                rankText,
                                exp,
                                userData.money?.toLocaleString() || 0,
                                userData.data?.bank?.balance?.toLocaleString() || 0
                        ) + extraInfo);
                } catch (error) {
                        return message.reply(getLang("userNotFound"));
                }
        }
};