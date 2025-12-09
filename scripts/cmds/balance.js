const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const fontDir = path.join(__dirname, 'assets', 'font');
const cacheDir = path.join(__dirname, 'cache');

try {
    if (fs.existsSync(path.join(fontDir, 'NotoSans-Bold.ttf'))) {
        registerFont(path.join(fontDir, 'NotoSans-Bold.ttf'), { family: 'NotoSans', weight: 'bold' });
    }
    if (fs.existsSync(path.join(fontDir, 'NotoSans-SemiBold.ttf'))) {
        registerFont(path.join(fontDir, 'NotoSans-SemiBold.ttf'), { family: 'NotoSans', weight: '600' });
    }
    if (fs.existsSync(path.join(fontDir, 'NotoSans-Regular.ttf'))) {
        registerFont(path.join(fontDir, 'NotoSans-Regular.ttf'), { family: 'NotoSans', weight: 'normal' });
    }
    if (fs.existsSync(path.join(fontDir, 'BeVietnamPro-Bold.ttf'))) {
        registerFont(path.join(fontDir, 'BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro', weight: 'bold' });
    }
    if (fs.existsSync(path.join(fontDir, 'BeVietnamPro-SemiBold.ttf'))) {
        registerFont(path.join(fontDir, 'BeVietnamPro-SemiBold.ttf'), { family: 'BeVietnamPro', weight: '600' });
    }
} catch (e) {
    console.log("BalanceCard: Using fallback fonts");
}

const CURRENCY_SYMBOL = "$";

function formatMoney(amount) {
    return amount.toLocaleString("en-US");
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
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

async function getProfilePicture(uid) {
    try {
        const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const response = await axios.get(avatarURL, { responseType: 'arraybuffer', timeout: 10000 });
        return await loadImage(Buffer.from(response.data));
    } catch (error) {
        console.error("Failed to fetch profile picture:", error.message);
        return null;
    }
}

function drawDefaultAvatar(ctx, x, y, size) {
    const gradient = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
    gradient.addColorStop(0, '#22c55e');
    gradient.addColorStop(1, '#16a34a');
    
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2 - 10, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(x + size/2, y + size/2 + 45, 40, 30, 0, Math.PI, 0, true);
    ctx.fill();
}

async function createBalanceCard(userData, userID, balance) {
    const width = 950;
    const height = 520;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0f0d');
    gradient.addColorStop(0.3, '#0d1f17');
    gradient.addColorStop(0.6, '#0f2a1d');
    gradient.addColorStop(1, '#0a0f0d');
    
    drawRoundedRect(ctx, 0, 0, width, height, 25);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.save();
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5 + 0.3;
        const opacity = Math.random() * 0.3 + 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.03)';
    ctx.lineWidth = 1;
    for (let i = -height; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 12, 12, width - 24, height - 24, 20);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 16);
    ctx.stroke();

    const glowGradient = ctx.createLinearGradient(0, 0, 350, 0);
    glowGradient.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
    glowGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, 350, height);

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('WALLET BALANCE', 50, 70);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.font = '600 15px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Digital Payment Card', 50, 100);

    ctx.font = '600 14px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = 'rgba(187, 247, 208, 0.7)';
    ctx.fillText('AVAILABLE BALANCE', 50, 175);

    ctx.save();
    for (let i = 12; i > 0; i--) {
        ctx.fillStyle = `rgba(34, 197, 94, ${0.015 * i})`;
        ctx.font = `bold ${68 + i * 0.5}px "NotoSans", "BeVietnamPro", sans-serif`;
        ctx.fillText(`${CURRENCY_SYMBOL}${formatMoney(balance)}`, 48 + (12 - i) * 0.2, 248 + (12 - i) * 0.2);
    }
    ctx.restore();

    const balanceGradient = ctx.createLinearGradient(50, 200, 450, 250);
    balanceGradient.addColorStop(0, '#4ade80');
    balanceGradient.addColorStop(0.5, '#22c55e');
    balanceGradient.addColorStop(1, '#16a34a');
    ctx.fillStyle = balanceGradient;
    ctx.font = 'bold 68px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillText(`${CURRENCY_SYMBOL}${formatMoney(balance)}`, 50, 250);

    ctx.font = '600 14px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = 'rgba(187, 247, 208, 0.7)';
    ctx.fillText('CARD HOLDER', 50, 320);

    ctx.font = 'bold 26px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = '#ffffff';
    const displayName = (userData.name || 'Unknown').toUpperCase().slice(0, 22);
    ctx.fillText(displayName, 50, 355);

    ctx.font = '600 14px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = 'rgba(187, 247, 208, 0.7)';
    ctx.fillText('USER ID', 50, 410);

    ctx.font = 'bold 18px "NotoSans", "BeVietnamPro", monospace';
    ctx.fillStyle = '#bbf7d0';
    ctx.fillText(userID, 50, 445);

    const profilePic = await getProfilePicture(userID);
    const picSize = 130;
    const picX = width - picSize - 55;
    const picY = 55;

    ctx.save();
    for (let i = 18; i > 0; i--) {
        ctx.beginPath();
        ctx.arc(picX + picSize / 2, picY + picSize / 2, picSize / 2 + i, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${0.02 * i})`;
        ctx.fill();
    }
    ctx.restore();

    if (profilePic) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(picX + picSize / 2, picY + picSize / 2, picSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(profilePic, picX, picY, picSize, picSize);
        ctx.restore();
    } else {
        drawDefaultAvatar(ctx, picX, picY, picSize);
    }

    ctx.beginPath();
    ctx.arc(picX + picSize / 2, picY + picSize / 2, picSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(picX + picSize / 2, picY + picSize / 2, picSize / 2 + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const statusX = picX + picSize - 12;
    const statusY = picY + picSize - 12;
    ctx.beginPath();
    ctx.arc(statusX, statusY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
    ctx.strokeStyle = '#0a0f0d';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
    drawRoundedRect(ctx, width - 200, height - 125, 160, 85, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.font = '600 11px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = 'rgba(187, 247, 208, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('CARD STATUS', width - 120, height - 98);
    
    ctx.font = 'bold 16px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('ACTIVE', width - 120, height - 68);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
    drawRoundedRect(ctx, width - 380, height - 125, 160, 85, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.font = '600 11px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = 'rgba(187, 247, 208, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('CARD TYPE', width - 300, height - 98);
    
    ctx.font = 'bold 16px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('PREMIUM', width - 300, height - 68);
    ctx.restore();

    const chipX = width - 190;
    const chipY = 210;
    const chipGradient = ctx.createLinearGradient(chipX, chipY, chipX + 65, chipY + 50);
    chipGradient.addColorStop(0, '#d4af37');
    chipGradient.addColorStop(0.3, '#f5d76e');
    chipGradient.addColorStop(0.7, '#d4af37');
    chipGradient.addColorStop(1, '#a67c00');
    
    drawRoundedRect(ctx, chipX, chipY, 65, 50, 6);
    ctx.fillStyle = chipGradient;
    ctx.fill();

    ctx.strokeStyle = '#a67c00';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(chipX, chipY + 10 + i * 10);
        ctx.lineTo(chipX + 65, chipY + 10 + i * 10);
        ctx.stroke();
    }
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(chipX + 18 + i * 22, chipY);
        ctx.lineTo(chipX + 18 + i * 22, chipY + 50);
        ctx.stroke();
    }

    ctx.save();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.font = '600 11px "NotoSans", "BeVietnamPro", sans-serif';
    ctx.fillStyle = 'rgba(187, 247, 208, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText(`Generated: ${dateStr}`, width - 50, height - 18);
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = {
    config: {
        name: "balancec",
        aliases: ["bal", "wallet", "mybalance", "wcard"],
        version: "2.0.0",
        author: "Neoaz ゐ",
        countDown: 10,
        role: 0,
        description: "Display your wallet balance with a professional card featuring your profile picture",
        category: "economy",
        guide: `{pn} - View your balance card
{pn} @tag - View tagged user's balance card`
    },

    onStart: async function({ message, event, usersData, args }) {
        try {
            message.reaction("⏳", event.messageID);

            await fs.ensureDir(cacheDir);

            let targetID = event.senderID;
            
            if (event.messageReply) {
                targetID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            } else if (args[0] && !isNaN(args[0])) {
                targetID = args[0];
            }

            const userData = await usersData.get(targetID);
            
            if (!userData) {
                message.reaction("❌", event.messageID);
                return message.reply("User not found in database!");
            }

            const balance = userData.money || 0;

            const buffer = await createBalanceCard(userData, targetID, balance);
            const imagePath = path.join(cacheDir, `balancecard_${targetID}_${Date.now()}.png`);
            
            await fs.writeFile(imagePath, buffer);

            const isOwn = targetID === event.senderID;
            const msgBody = isOwn 
                ? `${userData.name}\nBalance: ${CURRENCY_SYMBOL}${formatMoney(balance)}`
                : `WALLET CARD\n━━━━━━━━━━━━━━━━━━\n${userData.name}\nBalance: ${CURRENCY_SYMBOL}${formatMoney(balance)}`;

            await message.reply({
                body: msgBody,
                attachment: fs.createReadStream(imagePath)
            });

            message.reaction("✅", event.messageID);

            setTimeout(async () => {
                try {
                    if (await fs.pathExists(imagePath)) {
                        await fs.unlink(imagePath);
                    }
                } catch (e) {}
            }, 5000);

        } catch (error) {
            console.error("Balance Card Error:", error);
            message.reaction("❌", event.messageID);
            return message.reply("An error occurred while generating your balance card. Please try again.");
        }
    }
};
					
