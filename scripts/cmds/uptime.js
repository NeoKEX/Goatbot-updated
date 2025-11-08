const fs = require("fs-extra");
const os = require("os");

let createCanvas, loadImage;
let canvasAvailable = false;
try {
        const canvas = require("canvas");
        createCanvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
        canvasAvailable = true;
        console.log("✅ [UPTIME] Canvas loaded successfully - cards will be generated");
} catch (err) {
        console.log("❌ [UPTIME] Canvas not available - using text-only cards. Error:", err.message);
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

function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(" ");
}

function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function drawCircularIcon(ctx, x, y, radius, iconType, color) {
        const iconGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        iconGradient.addColorStop(0, color + "DD");
        iconGradient.addColorStop(0.7, color + "88");
        iconGradient.addColorStop(1, color + "44");
        ctx.fillStyle = iconGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        switch(iconType) {
                case 'clock':
                        ctx.beginPath();
                        ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
                        ctx.strokeStyle = "#FFFFFF";
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x, y - radius * 0.35);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + radius * 0.25, y);
                        ctx.stroke();
                        break;
                case 'server':
                        roundRect(ctx, x - radius * 0.4, y - radius * 0.35, radius * 0.8, radius * 0.7, 4);
                        ctx.strokeStyle = "#FFFFFF";
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        for (let i = 0; i < 3; i++) {
                                const dy = y - radius * 0.2 + i * radius * 0.2;
                                ctx.fillStyle = "#FFFFFF";
                                ctx.beginPath();
                                ctx.arc(x - radius * 0.2, dy, 3, 0, Math.PI * 2);
                                ctx.fill();
                        }
                        break;
                case 'cpu':
                        roundRect(ctx, x - radius * 0.35, y - radius * 0.35, radius * 0.7, radius * 0.7, 4);
                        ctx.strokeStyle = "#FFFFFF";
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        for (let i = -1; i <= 1; i += 2) {
                                for (let j = -1; j <= 1; j += 2) {
                                        ctx.fillRect(x + i * radius * 0.15 - 3, y + j * radius * 0.15 - 3, 6, 6);
                                }
                        }
                        break;
                case 'memory':
                        roundRect(ctx, x - radius * 0.35, y - radius * 0.4, radius * 0.7, radius * 0.8, 4);
                        ctx.strokeStyle = "#FFFFFF";
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        for (let i = 0; i < 4; i++) {
                                const barHeight = radius * 0.5 * (1 - i * 0.15);
                                ctx.fillStyle = "#FFFFFF";
                                roundRect(ctx, x - radius * 0.25 + i * radius * 0.18, y + radius * 0.15 - barHeight/2, radius * 0.12, barHeight, 2);
                                ctx.fill();
                        }
                        break;
                case 'platform':
                        ctx.beginPath();
                        ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
                        ctx.strokeStyle = "#FFFFFF";
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.ellipse(x, y, radius * 0.45, radius * 0.15, 0, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.ellipse(x, y, radius * 0.15, radius * 0.45, 0, 0, Math.PI * 2);
                        ctx.stroke();
                        break;
        }
        ctx.restore();
}

async function createUptimeCard(botUptime, systemUptime, cpuUsage, memoryUsage, totalMemory, platform, hostname, networkInfo) {
        if (!canvasAvailable) {
                return null;
        }

        try {
                const canvas = createCanvas(1400, 1050);
                const ctx = canvas.getContext("2d");

                roundRect(ctx, 0, 0, 1400, 1050, 30);
                ctx.clip();

                const gradient = ctx.createLinearGradient(0, 0, 1400, 1050);
                gradient.addColorStop(0, "#0f0c29");
                gradient.addColorStop(0.5, "#302b63");
                gradient.addColorStop(1, "#24243e");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1400, 1050);

                for (let i = 0; i < 80; i++) {
                        const x = Math.random() * 1400;
                        const y = Math.random() * 1050;
                        const radius = Math.random() * 120 + 60;
                        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        innerGradient.addColorStop(0, `rgba(218, 165, 32, ${Math.random() * 0.12})`);
                        innerGradient.addColorStop(1, "rgba(218, 165, 32, 0)");
                        ctx.fillStyle = innerGradient;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                ctx.shadowColor = "rgba(255, 215, 0, 0.7)";
                ctx.shadowBlur = 50;
                roundRect(ctx, 25, 25, 1350, 1000, 25);
                ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.shadowBlur = 0;

                roundRect(ctx, 50, 50, 1300, 120, 20);
                const headerGradient = ctx.createLinearGradient(50, 50, 50, 170);
                headerGradient.addColorStop(0, "rgba(255, 215, 0, 0.3)");
                headerGradient.addColorStop(1, "rgba(255, 215, 0, 0.1)");
                ctx.fillStyle = headerGradient;
                ctx.fill();

                ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                ctx.lineWidth = 2;
                ctx.stroke();

                const titleGradient = ctx.createLinearGradient(0, 90, 0, 140);
                titleGradient.addColorStop(0, "#FFD700");
                titleGradient.addColorStop(0.5, "#FFA500");
                titleGradient.addColorStop(1, "#FFD700");
                ctx.fillStyle = titleGradient;
                ctx.font = "bold 64px Arial";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
                ctx.shadowBlur = 30;
                ctx.fillText("SYSTEM PERFORMANCE", 700, 130);
                ctx.shadowBlur = 0;

                const leftCardX = 70;
                const rightCardX = 730;
                const cardY = 210;
                const cardWidth = 610;
                const cardHeight = 160;
                const cardSpacing = 175;
                const iconSize = 50;

                const uptimeCards = [
                        { 
                                title: "Bot Uptime", 
                                value: formatUptime(botUptime),
                                subtitle: "Active Session Duration",
                                x: leftCardX,
                                iconType: 'clock',
                                iconColor: "#FFD700"
                        },
                        { 
                                title: "System Uptime", 
                                value: formatUptime(systemUptime),
                                subtitle: "Server Running Time",
                                x: rightCardX,
                                iconType: 'server',
                                iconColor: "#4CAF50"
                        }
                ];

                uptimeCards.forEach(card => {
                        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                        ctx.shadowBlur = 25;
                        roundRect(ctx, card.x, cardY, cardWidth, cardHeight, 20);
                        const cardGradient = ctx.createLinearGradient(card.x, cardY, card.x, cardY + cardHeight);
                        cardGradient.addColorStop(0, "rgba(70, 60, 120, 0.7)");
                        cardGradient.addColorStop(1, "rgba(40, 35, 80, 0.7)");
                        ctx.fillStyle = cardGradient;
                        ctx.fill();

                        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.shadowBlur = 0;

                        drawCircularIcon(ctx, card.x + iconSize + 20, cardY + cardHeight / 2, iconSize, card.iconType, card.iconColor);

                        ctx.font = "bold 28px Arial";
                        ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
                        ctx.textAlign = "left";
                        ctx.fillText(card.title, card.x + iconSize * 2 + 40, cardY + 50);

                        ctx.font = "bold 44px Arial";
                        const valueGrad = ctx.createLinearGradient(0, cardY + 80, 0, cardY + 120);
                        valueGrad.addColorStop(0, "#FFFFFF");
                        valueGrad.addColorStop(1, "#E0E0E0");
                        ctx.fillStyle = valueGrad;
                        ctx.fillText(card.value, card.x + iconSize * 2 + 40, cardY + 100);

                        ctx.font = "italic 18px Arial";
                        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                        ctx.fillText(card.subtitle, card.x + iconSize * 2 + 40, cardY + 130);
                });

                const perfCardY = cardY + cardSpacing;

                const cpuColor = cpuUsage > 80 ? "#FF6B6B" : cpuUsage > 50 ? "#FFA500" : "#4CAF50";
                roundRect(ctx, leftCardX, perfCardY, cardWidth, cardHeight, 20);
                ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctx.shadowBlur = 25;
                const cpuGradient = ctx.createLinearGradient(leftCardX, perfCardY, leftCardX, perfCardY + cardHeight);
                cpuGradient.addColorStop(0, "rgba(70, 60, 120, 0.7)");
                cpuGradient.addColorStop(1, "rgba(40, 35, 80, 0.7)");
                ctx.fillStyle = cpuGradient;
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;

                drawCircularIcon(ctx, leftCardX + iconSize + 20, perfCardY + cardHeight / 2, iconSize, 'cpu', cpuColor);

                ctx.font = "bold 28px Arial";
                ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
                ctx.textAlign = "left";
                ctx.fillText("CPU Usage", leftCardX + iconSize * 2 + 40, perfCardY + 50);

                ctx.font = "bold 44px Arial";
                ctx.fillStyle = cpuColor;
                ctx.fillText(`${cpuUsage.toFixed(1)}%`, leftCardX + iconSize * 2 + 40, perfCardY + 100);

                const barY = perfCardY + 125;
                const barWidth = cardWidth - (iconSize * 2 + 60);
                const barHeight = 14;
                roundRect(ctx, leftCardX + iconSize * 2 + 40, barY, barWidth, barHeight, 7);
                ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
                ctx.fill();

                const cpuBarWidth = (barWidth * cpuUsage) / 100;
                roundRect(ctx, leftCardX + iconSize * 2 + 40, barY, cpuBarWidth, barHeight, 7);
                const cpuBarGrad = ctx.createLinearGradient(leftCardX + iconSize * 2 + 40, barY, leftCardX + iconSize * 2 + 40 + cpuBarWidth, barY);
                cpuBarGrad.addColorStop(0, cpuColor);
                cpuBarGrad.addColorStop(1, cpuColor + "88");
                ctx.fillStyle = cpuBarGrad;
                ctx.fill();

                const memPercent = (memoryUsage / totalMemory) * 100;
                const memColor = memPercent > 80 ? "#FF6B6B" : memPercent > 50 ? "#FFA500" : "#4CAF50";

                roundRect(ctx, rightCardX, perfCardY, cardWidth, cardHeight, 20);
                ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctx.shadowBlur = 25;
                const memGradient = ctx.createLinearGradient(rightCardX, perfCardY, rightCardX, perfCardY + cardHeight);
                memGradient.addColorStop(0, "rgba(70, 60, 120, 0.7)");
                memGradient.addColorStop(1, "rgba(40, 35, 80, 0.7)");
                ctx.fillStyle = memGradient;
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;

                drawCircularIcon(ctx, rightCardX + iconSize + 20, perfCardY + cardHeight / 2, iconSize, 'memory', memColor);

                ctx.font = "bold 28px Arial";
                ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
                ctx.fillText("Memory Usage", rightCardX + iconSize * 2 + 40, perfCardY + 50);

                ctx.font = "bold 32px Arial";
                ctx.fillStyle = memColor;
                ctx.fillText(`${formatBytes(memoryUsage)} / ${formatBytes(totalMemory)}`, rightCardX + iconSize * 2 + 40, perfCardY + 100);

                const memBarY = perfCardY + 125;
                roundRect(ctx, rightCardX + iconSize * 2 + 40, memBarY, barWidth, barHeight, 7);
                ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
                ctx.fill();

                const memBarWidth = (barWidth * memPercent) / 100;
                roundRect(ctx, rightCardX + iconSize * 2 + 40, memBarY, memBarWidth, barHeight, 7);
                const memBarGrad = ctx.createLinearGradient(rightCardX + iconSize * 2 + 40, memBarY, rightCardX + iconSize * 2 + 40 + memBarWidth, memBarY);
                memBarGrad.addColorStop(0, memColor);
                memBarGrad.addColorStop(1, memColor + "88");
                ctx.fillStyle = memBarGrad;
                ctx.fill();

                const platformY = perfCardY + cardSpacing;
                roundRect(ctx, leftCardX, platformY, 1270, 110, 20);
                ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctx.shadowBlur = 25;
                const platformGradient = ctx.createLinearGradient(leftCardX, platformY, leftCardX, platformY + 110);
                platformGradient.addColorStop(0, "rgba(70, 60, 120, 0.7)");
                platformGradient.addColorStop(1, "rgba(40, 35, 80, 0.7)");
                ctx.fillStyle = platformGradient;
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;

                drawCircularIcon(ctx, leftCardX + iconSize + 20, platformY + 55, iconSize, 'platform', "#00BFFF");

                ctx.font = "bold 28px Arial";
                ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
                ctx.textAlign = "left";
                ctx.fillText("Platform", leftCardX + iconSize * 2 + 40, platformY + 45);

                ctx.font = "bold 38px Arial";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(platform.toUpperCase(), leftCardX + iconSize * 2 + 40, platformY + 85);

                ctx.font = "22px Arial";
                ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
                ctx.textAlign = "right";
                const currentTime = new Date().toLocaleString();
                ctx.fillText(`Updated: ${currentTime}`, 1320, platformY + 85);

                const networkY = platformY + 135;
                roundRect(ctx, leftCardX, networkY, 1270, 160, 20);
                ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctx.shadowBlur = 25;
                const networkGradient = ctx.createLinearGradient(leftCardX, networkY, leftCardX, networkY + 160);
                networkGradient.addColorStop(0, "rgba(70, 60, 120, 0.7)");
                networkGradient.addColorStop(1, "rgba(40, 35, 80, 0.7)");
                ctx.fillStyle = networkGradient;
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.beginPath();
                ctx.arc(leftCardX + iconSize + 20, networkY + 80, iconSize, 0, Math.PI * 2);
                const netIconGradient = ctx.createRadialGradient(leftCardX + iconSize + 20, networkY + 80, 0, leftCardX + iconSize + 20, networkY + 80, iconSize);
                netIconGradient.addColorStop(0, "#9C27B0DD");
                netIconGradient.addColorStop(0.7, "#9C27B088");
                netIconGradient.addColorStop(1, "#9C27B044");
                ctx.fillStyle = netIconGradient;
                ctx.fill();
                ctx.strokeStyle = "#9C27B0";
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "bold 36px Arial";
                ctx.textAlign = "center";
                ctx.fillText("⊕", leftCardX + iconSize + 20, networkY + 95);

                ctx.font = "bold 28px Arial";
                ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
                ctx.textAlign = "left";
                ctx.fillText("Network Configuration", leftCardX + iconSize * 2 + 40, networkY + 45);

                ctx.font = "bold 26px Arial";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(`▣ ${hostname}`, leftCardX + iconSize * 2 + 40, networkY + 85);

                ctx.font = "22px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                const ipText = networkInfo.length > 0 ? networkInfo.join(" • ") : "No network info";
                const maxNetWidth = 1270 - (iconSize * 2 + 60);
                if (ctx.measureText(ipText).width > maxNetWidth) {
                        const truncated = ipText.substring(0, 65) + "...";
                        ctx.fillText(truncated, leftCardX + iconSize * 2 + 40, networkY + 120);
                } else {
                        ctx.fillText(ipText, leftCardX + iconSize * 2 + 40, networkY + 120);
                }

                ctx.font = "italic 20px Arial";
                ctx.fillStyle = "rgba(255, 215, 0, 0.65)";
                ctx.textAlign = "center";
                ctx.fillText("Powered by Goat Bot V3 - NeoKEX", 700, 1025);

                const buffer = canvas.toBuffer();
                const tempPath = `./tmp/uptime_card_${Date.now()}.png`;
                await fs.outputFile(tempPath, buffer);
                return fs.createReadStream(tempPath);
        } catch (error) {
                console.error("Canvas error:", error.message);
                throw error;
        }
}

module.exports = {
        config: {
                name: "uptime",
                version: "1.0.0",
                author: "NeoKEX",
                countDown: 10,
                role: 0,
                description: {
                        en: "Display bot and system uptime with advanced dashboard"
                },
                category: "system",
                guide: {
                        en: "   {pn} - Display system dashboard with uptime and stats"
                }
        },

        langs: {
                en: {
                        uptimeInfo: "▣ System Dashboard\n\n◷ Bot Uptime: %1\n▣ System Uptime: %2\n⚡ CPU Usage: %3%\n◆ Memory: %4 / %5\n⊕ Platform: %6\n▣ Hostname: %7\n⊕ Network: %8"
                }
        },

        onStart: async function ({ message, getLang }) {
                const botUptime = process.uptime();
                const systemUptime = os.uptime();

                const cpus = os.cpus();
                let totalIdle = 0;
                let totalTick = 0;
                cpus.forEach(cpu => {
                        for (let type in cpu.times) {
                                totalTick += cpu.times[type];
                        }
                        totalIdle += cpu.times.idle;
                });
                const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);

                const totalMemory = os.totalmem();
                const freeMemory = os.freemem();
                const usedMemory = totalMemory - freeMemory;

                const platform = os.platform();
                const hostname = os.hostname();

                const networkInterfaces = os.networkInterfaces();
                const networkInfo = [];
                Object.keys(networkInterfaces).forEach(interfaceName => {
                        const interfaces = networkInterfaces[interfaceName];
                        interfaces.forEach(iface => {
                                if (iface.family === 'IPv4' && !iface.internal) {
                                        networkInfo.push(`${interfaceName}: ${iface.address}`);
                                }
                        });
                });
                if (networkInfo.length === 0) {
                        networkInterfaces['lo']?.forEach(iface => {
                                if (iface.family === 'IPv4') {
                                        networkInfo.push(`Local: ${iface.address}`);
                                }
                        });
                }

                try {
                        console.log("[UPTIME] Creating uptime dashboard card...");
                        const cardImage = await createUptimeCard(
                                botUptime,
                                systemUptime,
                                cpuUsage,
                                usedMemory,
                                totalMemory,
                                platform,
                                hostname,
                                networkInfo
                        );
                        console.log("[UPTIME] Card created, has buffer:", !!cardImage);

                        if (cardImage) {
                                const tempPath = cardImage.path;
                                console.log("[UPTIME] Card buffer path:", tempPath);
                                console.log("[UPTIME] Sending card image...");

                                cardImage.on('end', () => {
                                        fs.unlink(tempPath).catch(() => {});
                                });

                                return message.reply({
                                        attachment: cardImage
                                });
                        }
                } catch (err) {
                        console.error("Uptime card generation error:", err);
                }

                console.log("[UPTIME] Sending text-only response");
                return message.reply(getLang("uptimeInfo",
                        formatUptime(botUptime),
                        formatUptime(systemUptime),
                        cpuUsage.toFixed(1),
                        formatBytes(usedMemory),
                        formatBytes(totalMemory),
                        platform,
                        hostname,
                        networkInfo.join(", ") || "No network info"
                ));
        }
};