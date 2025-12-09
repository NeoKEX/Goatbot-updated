const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const fontDir = path.join(__dirname, 'assets', 'font');
const cacheDir = path.join(__dirname, 'cache');

registerFont(path.join(fontDir, 'BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro', weight: 'bold' });
registerFont(path.join(fontDir, 'BeVietnamPro-SemiBold.ttf'), { family: 'BeVietnamPro', weight: '600' });
registerFont(path.join(fontDir, 'BeVietnamPro-Regular.ttf'), { family: 'BeVietnamPro', weight: 'normal' });
registerFont(path.join(fontDir, 'NotoSans-Bold.ttf'), { family: 'NotoSans', weight: 'bold' });
registerFont(path.join(fontDir, 'NotoSans-SemiBold.ttf'), { family: 'NotoSans', weight: '600' });

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawGlowCircle(ctx, x, y, radius, colors, glowColor, glowSize = 30) {
    ctx.save();
    
    for (let i = glowSize; i > 0; i--) {
        const alpha = (1 - i / glowSize) * 0.15;
        ctx.beginPath();
        ctx.arc(x, y, radius + i, 0, Math.PI * 2);
        ctx.fillStyle = glowColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fill();
    }
    
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, colors[2] || colors[1]);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, radius - 5, -Math.PI * 0.7, -Math.PI * 0.3);
    const shineGradient = ctx.createLinearGradient(x - radius, y - radius, x, y);
    shineGradient.addColorStop(0, 'rgba(255,255,255,0.4)');
    shineGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = shineGradient;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
}

function drawProgressArc(ctx, x, y, radius, progress, bgColor, fillColor, lineWidth = 8) {
    ctx.save();
    
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI * 0.75, Math.PI * 0.75);
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    if (progress > 0) {
        const sweepAngle = (Math.PI * 1.5) * (progress / 100);
        ctx.beginPath();
        ctx.arc(x, y, radius, -Math.PI * 0.75, -Math.PI * 0.75 + sweepAngle);
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawConnectingLine(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.05)');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0.05)');
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const dotX = x1 + (x2 - x1) * 0.3;
    const dotY = y1 + (y2 - y1) * 0.3;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.restore();
}

function drawIcon(ctx, x, y, size, type, color = 'rgba(255,255,255,0.9)') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const scale = size / 24;
    ctx.translate(x - 12 * scale, y - 12 * scale);
    ctx.scale(scale, scale);
    
    switch(type) {
        case 'server':
            ctx.beginPath();
            ctx.roundRect(4, 3, 16, 5, 2);
            ctx.roundRect(4, 10, 16, 5, 2);
            ctx.roundRect(4, 17, 16, 4, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(7, 5.5, 1, 0, Math.PI * 2);
            ctx.arc(7, 12.5, 1, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'cpu':
            ctx.strokeRect(6, 6, 12, 12);
            ctx.beginPath();
            const pins = [[9,3,9,6], [12,3,12,6], [15,3,15,6], [9,18,9,21], [12,18,12,21], [15,18,15,21],
                         [3,9,6,9], [3,12,6,12], [3,15,6,15], [18,9,21,9], [18,12,21,12], [18,15,21,15]];
            pins.forEach(([a,b,c,d]) => { ctx.moveTo(a, b); ctx.lineTo(c, d); });
            ctx.stroke();
            ctx.fillRect(9, 9, 6, 6);
            break;
        case 'ram':
            ctx.strokeRect(2, 7, 20, 10);
            ctx.fillRect(5, 10, 3, 4);
            ctx.fillRect(10, 10, 3, 4);
            ctx.fillRect(16, 10, 3, 4);
            break;
        case 'storage':
            ctx.beginPath();
            ctx.ellipse(12, 7, 8, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(4, 7); ctx.lineTo(4, 17);
            ctx.moveTo(20, 7); ctx.lineTo(20, 17);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(12, 17, 8, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case 'bandwidth':
            ctx.beginPath();
            ctx.moveTo(3, 17); ctx.lineTo(8, 11); ctx.lineTo(12, 14); ctx.lineTo(16, 7); ctx.lineTo(21, 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(16, 7); ctx.lineTo(21, 7); ctx.lineTo(21, 12);
            ctx.stroke();
            break;
        case 'domain':
            ctx.beginPath();
            ctx.arc(12, 12, 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(12, 12, 4, 9, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.moveTo(3, 12); ctx.lineTo(21, 12);
            ctx.moveTo(12, 3); ctx.lineTo(12, 21);
            ctx.stroke();
            break;
        case 'ssl':
            ctx.strokeRect(5, 11, 14, 9);
            ctx.beginPath();
            ctx.moveTo(8, 11); ctx.lineTo(8, 8);
            ctx.arc(12, 8, 4, Math.PI, 0);
            ctx.lineTo(16, 11);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(12, 15, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'email':
            ctx.strokeRect(2, 5, 20, 14);
            ctx.beginPath();
            ctx.moveTo(2, 5); ctx.lineTo(12, 12); ctx.lineTo(22, 5);
            ctx.stroke();
            break;
        case 'ftp':
            ctx.beginPath();
            ctx.moveTo(12, 4); ctx.lineTo(12, 16);
            ctx.moveTo(7, 9); ctx.lineTo(12, 4); ctx.lineTo(17, 9);
            ctx.stroke();
            ctx.strokeRect(4, 16, 16, 4);
            break;
        case 'database':
            ctx.beginPath();
            ctx.ellipse(12, 6, 7, 3, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(5, 6); ctx.lineTo(5, 18);
            ctx.moveTo(19, 6); ctx.lineTo(19, 18);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(12, 12, 7, 3, 0, Math.PI, 0, true);
            ctx.ellipse(12, 18, 7, 3, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case 'uptime':
            ctx.beginPath();
            ctx.arc(12, 12, 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(12, 6); ctx.lineTo(12, 12); ctx.lineTo(17, 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(12, 12, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'visitors':
            ctx.beginPath();
            ctx.arc(9, 8, 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, 21); ctx.quadraticCurveTo(9, 14, 16, 21);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(17, 6, 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(12, 18); ctx.quadraticCurveTo(17, 12, 22, 18);
            ctx.stroke();
            break;
        case 'php':
            ctx.font = 'bold 14px BeVietnamPro';
            ctx.textAlign = 'center';
            ctx.fillText('{ }', 12, 16);
            break;
    }
    ctx.restore();
}

async function generateCpanelCard(botName = "GOAT BOT") {
    const width = 1600;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;

    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, height);
    bgGradient.addColorStop(0, '#1a1a3e');
    bgGradient.addColorStop(0.4, '#0f1628');
    bgGradient.addColorStop(0.7, '#0a0f1a');
    bgGradient.addColorStop(1, '#050810');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.6 + 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let r = 100; r < Math.max(width, height); r += 80) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    const cpuUsage = getRandomInt(15, 45);
    const ramUsage = getRandomInt(30, 65);
    const storageUsed = getRandomInt(20, 70);
    const bandwidthUsed = getRandomInt(40, 85);
    const uptime = os.uptime();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const hostingData = {
        serverStatus: 'Online',
        serverLocation: 'US-East',
        cpuUsage: cpuUsage,
        cpuCores: os.cpus().length,
        ramUsage: ramUsage,
        ramUsed: formatBytes(usedMem),
        storageUsed: storageUsed,
        storageTotal: '50 GB',
        bandwidthUsed: bandwidthUsed,
        domains: getRandomInt(1, 5),
        sslStatus: 'Active',
        emailAccounts: getRandomInt(1, 20),
        ftpAccounts: getRandomInt(1, 5),
        databases: getRandomInt(1, 10),
        uptime: formatUptime(uptime),
        visitors: getRandomInt(100, 5000),
        phpVersion: '8.2'
    };

    const infoCircles = [
        { title: 'SERVER', icon: 'server', value: hostingData.serverStatus, sub: hostingData.serverLocation, colors: ['#34d399', '#10b981', '#059669'], glow: 'rgb(16, 185, 129)' },
        { title: 'CPU', icon: 'cpu', value: `${hostingData.cpuUsage}%`, sub: `${hostingData.cpuCores} Cores`, colors: ['#818cf8', '#6366f1', '#4f46e5'], glow: 'rgb(99, 102, 241)', progress: hostingData.cpuUsage },
        { title: 'RAM', icon: 'ram', value: `${hostingData.ramUsage}%`, sub: hostingData.ramUsed, colors: ['#fbbf24', '#f59e0b', '#d97706'], glow: 'rgb(245, 158, 11)', progress: hostingData.ramUsage },
        { title: 'STORAGE', icon: 'storage', value: `${hostingData.storageUsed}%`, sub: hostingData.storageTotal, colors: ['#f472b6', '#ec4899', '#db2777'], glow: 'rgb(236, 72, 153)', progress: hostingData.storageUsed },
        { title: 'BANDWIDTH', icon: 'bandwidth', value: `${hostingData.bandwidthUsed}%`, sub: '1 TB/mo', colors: ['#2dd4bf', '#14b8a6', '#0d9488'], glow: 'rgb(20, 184, 166)', progress: hostingData.bandwidthUsed },
        { title: 'DOMAINS', icon: 'domain', value: hostingData.domains, sub: 'Active', colors: ['#a78bfa', '#8b5cf6', '#7c3aed'], glow: 'rgb(139, 92, 246)' },
        { title: 'SSL', icon: 'ssl', value: hostingData.sslStatus, sub: 'Secured', colors: ['#4ade80', '#22c55e', '#16a34a'], glow: 'rgb(34, 197, 94)' },
        { title: 'EMAIL', icon: 'email', value: hostingData.emailAccounts, sub: 'Accounts', colors: ['#60a5fa', '#3b82f6', '#2563eb'], glow: 'rgb(59, 130, 246)' },
        { title: 'FTP', icon: 'ftp', value: hostingData.ftpAccounts, sub: 'Accounts', colors: ['#fb7185', '#f43f5e', '#e11d48'], glow: 'rgb(244, 63, 94)' },
        { title: 'DATABASE', icon: 'database', value: hostingData.databases, sub: 'MySQL', colors: ['#38bdf8', '#0ea5e9', '#0284c7'], glow: 'rgb(14, 165, 233)' },
        { title: 'UPTIME', icon: 'uptime', value: hostingData.uptime, sub: '99.9% SLA', colors: ['#a3e635', '#84cc16', '#65a30d'], glow: 'rgb(132, 204, 22)' },
        { title: 'VISITORS', icon: 'visitors', value: hostingData.visitors.toLocaleString(), sub: 'This Month', colors: ['#c084fc', '#a855f7', '#9333ea'], glow: 'rgb(168, 85, 247)' },
    ];

    const outerRadius = 420;
    const circleRadius = 95;

    infoCircles.forEach((circle, index) => {
        const angle = (Math.PI * 2 / 12) * index - Math.PI / 2;
        const x = centerX + Math.cos(angle) * outerRadius;
        const y = centerY + Math.sin(angle) * outerRadius;
        
        const innerEdgeX = centerX + Math.cos(angle) * 160;
        const innerEdgeY = centerY + Math.sin(angle) * 160;
        const outerEdgeX = centerX + Math.cos(angle) * (outerRadius - circleRadius - 10);
        const outerEdgeY = centerY + Math.sin(angle) * (outerRadius - circleRadius - 10);
        
        drawConnectingLine(ctx, innerEdgeX, innerEdgeY, outerEdgeX, outerEdgeY, circle.glow.replace('rgb', 'rgba').replace(')', ', 0.4)'));
    });

    const centerRadius = 150;
    
    ctx.save();
    for (let i = 50; i > 0; i--) {
        const alpha = (1 - i / 50) * 0.2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius + i, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.fill();
    }
    ctx.restore();
    
    const centerGradient = ctx.createRadialGradient(centerX - 40, centerY - 40, 0, centerX, centerY, centerRadius);
    centerGradient.addColorStop(0, '#4f46e5');
    centerGradient.addColorStop(0.5, '#3730a3');
    centerGradient.addColorStop(1, '#1e1b4b');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.fillStyle = centerGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px BeVietnamPro';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('∆', centerX, centerY - 45);
    
    ctx.font = 'bold 32px BeVietnamPro';
    ctx.fillText('NeoKEX AI', centerX, centerY);
    
    ctx.font = '600 16px BeVietnamPro';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('CONTROL PANEL', centerX, centerY + 35);
    
    ctx.font = '600 14px BeVietnamPro';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Hosting Dashboard', centerX, centerY + 60);
    ctx.restore();

    infoCircles.forEach((circle, index) => {
        const angle = (Math.PI * 2 / 12) * index - Math.PI / 2;
        const x = centerX + Math.cos(angle) * outerRadius;
        const y = centerY + Math.sin(angle) * outerRadius;
        
        drawGlowCircle(ctx, x, y, circleRadius, circle.colors, circle.glow, 25);
        
        if (circle.progress !== undefined) {
            drawProgressArc(ctx, x, y, circleRadius + 12, circle.progress, 'rgba(0,0,0,0.3)', '#ffffff', 6);
        }
        
        drawIcon(ctx, x, y - 30, 28, circle.icon);
        
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px BeVietnamPro';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(circle.title, x, y - 5);
        
        ctx.font = 'bold 24px BeVietnamPro';
        ctx.fillText(String(circle.value), x, y + 22);
        
        ctx.font = '600 12px BeVietnamPro';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(circle.sub, x, y + 45);
        ctx.restore();
    });

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 14px BeVietnamPro';
    ctx.textAlign = 'center';
    ctx.fillText(`Last Updated: ${new Date().toLocaleString()}`, centerX, height - 40);
    
    ctx.font = '600 12px BeVietnamPro';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('Real-time Monitoring System', centerX, height - 20);
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = {
    config: {
        name: "cpanel",
        aliases: ["hosting", "server", "hostinfo", "panel"],
        version: "2.0.0",
        author: "Neoaz ゐ",
        countDown: 10,
        role: 0,
        description: "Display hosting information with beautiful circular visual interface",
        category: "utility",
        guide: "{pn}"
    },

    onStart: async function({ message, event }) {
        try {
            message.reaction("⏳", event.messageID);
            
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirpSync(cacheDir);
            }

            const botName = global.GoatBot?.config?.nickNameBot || "GOAT BOT";
            const buffer = await generateCpanelCard(botName);
            const imagePath = path.join(cacheDir, `cpanel_${Date.now()}.png`);
            
            fs.writeFileSync(imagePath, buffer);

            await message.reply({
                body: "📊 𝗛𝗢𝗦𝗧𝗜𝗡𝗚 𝗖𝗢𝗡𝗧𝗥𝗢𝗟 𝗣𝗔𝗡𝗘𝗟",
                attachment: fs.createReadStream(imagePath)
            });

            message.reaction("✅", event.messageID);
            
            setTimeout(() => {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }, 5000);

        } catch (error) {
            console.error("CPanel Command Error:", error);
            message.reaction("❌", event.messageID);
            return message.reply("❌ An error occurred while generating the hosting panel. Please try again.");
        }
    }
};
              
