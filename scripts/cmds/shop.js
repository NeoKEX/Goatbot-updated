const fs = require("fs-extra");

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

async function createShopCard(shopItems, userInventory, userMoney) {
        if (!canvasAvailable) {
                return null;
        }

        try {
                const canvas = createCanvas(1400, 1200);
                const ctx = canvas.getContext("2d");

                roundRect(ctx, 0, 0, 1400, 1200, 35);
                ctx.clip();

                const bgGradient = ctx.createLinearGradient(0, 0, 1400, 1200);
                bgGradient.addColorStop(0, "#0D1117");
                bgGradient.addColorStop(0.3, "#161B22");
                bgGradient.addColorStop(0.7, "#1C2128");
                bgGradient.addColorStop(1, "#0D1117");
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, 1400, 1200);

                for (let i = 0; i < 50; i++) {
                        const x = Math.random() * 1400;
                        const y = Math.random() * 1200;
                        const radius = Math.random() * 120 + 60;
                        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        innerGradient.addColorStop(0, `rgba(88, 166, 255, ${Math.random() * 0.12})`);
                        innerGradient.addColorStop(0.5, `rgba(147, 51, 234, ${Math.random() * 0.08})`);
                        innerGradient.addColorStop(1, "rgba(88, 166, 255, 0)");
                        ctx.fillStyle = innerGradient;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                }

                ctx.shadowColor = "rgba(88, 166, 255, 0.5)";
                ctx.shadowBlur = 50;
                roundRect(ctx, 20, 20, 1360, 1160, 30);
                const borderGradient = ctx.createLinearGradient(20, 20, 20, 1180);
                borderGradient.addColorStop(0, "rgba(88, 166, 255, 0.8)");
                borderGradient.addColorStop(0.5, "rgba(147, 51, 234, 0.8)");
                borderGradient.addColorStop(1, "rgba(88, 166, 255, 0.8)");
                ctx.strokeStyle = borderGradient;
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.shadowBlur = 0;

                roundRect(ctx, 50, 50, 1300, 130, 20);
                const headerGradient = ctx.createLinearGradient(50, 50, 1350, 180);
                headerGradient.addColorStop(0, "rgba(88, 166, 255, 0.25)");
                headerGradient.addColorStop(0.5, "rgba(147, 51, 234, 0.25)");
                headerGradient.addColorStop(1, "rgba(236, 72, 153, 0.25)");
                ctx.fillStyle = headerGradient;
                ctx.fill();
                const headerBorder = ctx.createLinearGradient(50, 50, 1350, 180);
                headerBorder.addColorStop(0, "rgba(88, 166, 255, 0.5)");
                headerBorder.addColorStop(1, "rgba(236, 72, 153, 0.5)");
                ctx.strokeStyle = headerBorder;
                ctx.lineWidth = 2;
                ctx.stroke();

                const titleGradient = ctx.createLinearGradient(0, 90, 1400, 140);
                titleGradient.addColorStop(0, "#58A6FF");
                titleGradient.addColorStop(0.3, "#9333EA");
                titleGradient.addColorStop(0.7, "#EC4899");
                titleGradient.addColorStop(1, "#58A6FF");
                ctx.fillStyle = titleGradient;
                ctx.font = "bold 68px Arial";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(88, 166, 255, 0.7)";
                ctx.shadowBlur = 30;
                ctx.fillText("◈ PREMIUM CASINO SHOP ◆", 700, 135);
                ctx.shadowBlur = 0;

                ctx.font = "bold 26px Arial";
                const balanceGradient = ctx.createLinearGradient(0, 165, 1400, 165);
                balanceGradient.addColorStop(0, "#10B981");
                balanceGradient.addColorStop(0.5, "#3B82F6");
                balanceGradient.addColorStop(1, "#10B981");
                ctx.fillStyle = balanceGradient;
                ctx.fillText(`💰 Your Balance: $${userMoney.toLocaleString()}`, 700, 165);

                const itemsPerRow = 2;
                const cardWidth = 620;
                const cardHeight = 200;
                const startX = 70;
                const startY = 210;
                const spacingX = 660;
                const spacingY = 220;

                Object.entries(shopItems).forEach(([num, item], index) => {
                        const row = Math.floor(index / itemsPerRow);
                        const col = index % itemsPerRow;
                        const x = startX + (col * spacingX);
                        const y = startY + (row * spacingY);

                        const isOwned = userInventory.some(i => i.name === item.name);

                        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                        ctx.shadowBlur = 20;
                        roundRect(ctx, x, y, cardWidth, cardHeight, 15);

                        const cardGradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
                        if (isOwned) {
                                cardGradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
                                cardGradient.addColorStop(1, "rgba(5, 150, 105, 0.3)");
                        } else {
                                cardGradient.addColorStop(0, "rgba(30, 41, 59, 0.7)");
                                cardGradient.addColorStop(1, "rgba(15, 23, 42, 0.7)");
                        }
                        ctx.fillStyle = cardGradient;
                        ctx.fill();

                        const itemBorder = ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
                        if (isOwned) {
                                itemBorder.addColorStop(0, "rgba(16, 185, 129, 0.9)");
                                itemBorder.addColorStop(1, "rgba(34, 197, 94, 0.9)");
                        } else {
                                itemBorder.addColorStop(0, "rgba(88, 166, 255, 0.6)");
                                itemBorder.addColorStop(0.5, "rgba(147, 51, 234, 0.6)");
                                itemBorder.addColorStop(1, "rgba(236, 72, 153, 0.6)");
                        }
                        ctx.strokeStyle = itemBorder;
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        ctx.shadowBlur = 0;

                        ctx.font = "bold 60px Arial";
                        const iconGradient = ctx.createLinearGradient(x + 40, y + 40, x + 100, y + 100);
                        iconGradient.addColorStop(0, isOwned ? "#10B981" : "#58A6FF");
                        iconGradient.addColorStop(1, isOwned ? "#22C55E" : "#9333EA");
                        ctx.fillStyle = iconGradient;
                        ctx.textAlign = "center";
                        ctx.fillText(item.icon, x + 70, y + 85);

                        ctx.font = "bold 32px Arial";
                        const nameGradient = ctx.createLinearGradient(x + 120, y + 40, x + 120, y + 70);
                        nameGradient.addColorStop(0, "#E0E7FF");
                        nameGradient.addColorStop(1, "#C7D2FE");
                        ctx.fillStyle = nameGradient;
                        ctx.textAlign = "left";
                        ctx.fillText(item.name, x + 120, y + 55);

                        ctx.font = "22px Arial";
                        ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
                        ctx.fillText(item.desc, x + 120, y + 90);

                        ctx.font = "bold 36px Arial";
                        const priceGradient = ctx.createLinearGradient(x + 120, y + 115, x + 120, y + 145);
                        if (isOwned) {
                                priceGradient.addColorStop(0, "#10B981");
                                priceGradient.addColorStop(1, "#22C55E");
                        } else {
                                priceGradient.addColorStop(0, "#FBBF24");
                                priceGradient.addColorStop(1, "#F59E0B");
                        }
                        ctx.fillStyle = priceGradient;
                        ctx.fillText(`$${item.price.toLocaleString()}`, x + 120, y + 135);

                        roundRect(ctx, x + 440, y + 110, 160, 65, 12);
                        const btnGradient = ctx.createLinearGradient(x + 440, y + 110, x + 600, y + 175);
                        if (isOwned) {
                                btnGradient.addColorStop(0, "rgba(16, 185, 129, 0.9)");
                                btnGradient.addColorStop(1, "rgba(5, 150, 105, 0.9)");
                        } else {
                                btnGradient.addColorStop(0, "rgba(88, 166, 255, 0.9)");
                                btnGradient.addColorStop(0.5, "rgba(147, 51, 234, 0.9)");
                                btnGradient.addColorStop(1, "rgba(236, 72, 153, 0.9)");
                        }
                        ctx.fillStyle = btnGradient;
                        ctx.fill();
                        ctx.strokeStyle = isOwned ? "#10B981" : "#58A6FF";
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        ctx.font = "bold 24px Arial";
                        ctx.fillStyle = "#FFFFFF";
                        ctx.textAlign = "center";
                        ctx.fillText(isOwned ? "OWNED" : `BUY #${num}`, x + 520, y + 150);

                        ctx.font = "18px Arial";
                        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                        ctx.fillText(`◈ Item ${num}`, x + 70, y + 180);
                });

                ctx.font = "italic 20px Arial";
                const footerGradient = ctx.createLinearGradient(0, 1170, 1400, 1170);
                footerGradient.addColorStop(0, "rgba(88, 166, 255, 0.7)");
                footerGradient.addColorStop(0.5, "rgba(147, 51, 234, 0.7)");
                footerGradient.addColorStop(1, "rgba(236, 72, 153, 0.7)");
                ctx.fillStyle = footerGradient;
                ctx.textAlign = "center";
                ctx.fillText("Powered by NeoKEX", 700, 1170);

                const buffer = canvas.toBuffer();
                const tempPath = `./tmp/shop_card_${Date.now()}.png`;
                await fs.outputFile(tempPath, buffer);
                return fs.createReadStream(tempPath);
        } catch (error) {
                return null;
        }
}

module.exports = {
        config: {
                name: "shop",
                aliases: ["store", "buy"],
                version: "3.0.0",
                author: "NeoKEX",
                countDown: 10,
                role: 0,
                description: {
                        en: "Buy items, power-ups, and upgrades"
                },
                category: "economy",
                guide: {
                        en: "   {pn} - View available items"
                                + "\n   {pn} buy <item> - Purchase an item"
                                + "\n   {pn} inventory - View your items"
                }
        },

        langs: {
                en: {
                        shopList: "CASINO SHOP\n\n%1\n\nUse {pn} buy <item number> to purchase!",
                        bought: "✅ Successfully purchased: %1\nCost: $%2\nNew Balance: $%3",
                        insufficientMoney: "Insufficient funds! Need: $%1, Have: $%2",
                        invalidItem: "Invalid item! Use {pn} to view available items.",
                        inventory: "YOUR INVENTORY\n\n%1",
                        emptyInventory: "Your inventory is empty! Visit the shop to buy items.",
                        alreadyOwned: "You already own this item!"
                }
        },

        onStart: async function ({ args, message, event, usersData, getLang, commandName }) {
                const { senderID, threadID } = event;
                const userData = await usersData.get(senderID);

                if (!userData.data.inventory) {
                        userData.data.inventory = [];
                }

                const shopItems = {
                        1: { name: "XP Booster", price: 1000, icon: "◈", desc: "2x XP for 24 hours", type: "booster" },
                        2: { name: "Money Multiplier", price: 2000, icon: "◆", desc: "1.5x money earnings", type: "multiplier" },
                        3: { name: "VIP Badge", price: 5000, icon: "♔", desc: "Show off your status", type: "badge" },
                        4: { name: "Lucky Charm", price: 1500, icon: "✦", desc: "Better casino odds", type: "charm" },
                        5: { name: "Premium Theme", price: 3000, icon: "◐", desc: "Custom profile theme", type: "theme" },
                        6: { name: "Daily Streak Saver", price: 2500, icon: "◊", desc: "Save 1 missed daily", type: "saver" },
                        7: { name: "Work Pass", price: 1200, icon: "▣", desc: "Reduce work cooldown 50%", type: "pass" },
                        8: { name: "Rep Shield", price: 800, icon: "◙", desc: "Block negative rep", type: "shield" }
                };

                const action = args[0]?.toLowerCase();

                switch (action) {
                        case "buy": {
                                const itemNum = parseInt(args[1]);
                                if (isNaN(itemNum) || !shopItems[itemNum]) {
                                        const prefix = global.utils.getPrefix(threadID);
                                        return message.reply(getLang("invalidItem").replace("{pn}", `${prefix}${commandName}`));
                                }

                                const item = shopItems[itemNum];

                                if (userData.data.inventory.some(i => i.name === item.name)) {
                                        return message.reply(getLang("alreadyOwned"));
                                }

                                if (userData.money < item.price) {
                                        return message.reply(getLang("insufficientMoney", item.price.toLocaleString(), userData.money.toLocaleString()));
                                }

                                userData.money -= item.price;
                                userData.data.inventory.push({
                                        ...item,
                                        purchaseDate: new Date().toISOString(),
                                        active: item.type === "booster" || item.type === "multiplier" ? false : true
                                });

                                await usersData.set(senderID, {
                                        money: userData.money,
                                        data: userData.data
                                });

                                return message.reply(getLang("bought", `${item.icon} ${item.name}`, item.price.toLocaleString(), userData.money.toLocaleString()));
                        }

                        case "inventory":
                        case "inv": {
                                if (userData.data.inventory.length === 0) {
                                        return message.reply(getLang("emptyInventory"));
                                }

                                let inv = "";
                                userData.data.inventory.forEach((item, index) => {
                                        const status = item.active ? "✅" : "⏸️";
                                        inv += `${index + 1}. ${status} ${item.icon} ${item.name}\n   ${item.desc}\n\n`;
                                });

                                return message.reply(getLang("inventory", inv));
                        }

                        default: {
                                try {
                                        const cardImage = await createShopCard(shopItems, userData.data.inventory, userData.money);

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
                                let shopList = "";
                                for (const [num, item] of Object.entries(shopItems)) {
                                        const owned = userData.data.inventory.some(i => i.name === item.name) ? "◆" : "◈";
                                        shopList += `${owned} ${num}. ${item.icon} ${item.name} - $${item.price.toLocaleString()}\n   ${item.desc}\n\n`;
                                }

                                const prefix = global.utils.getPrefix(threadID);
                                return message.reply(getLang("shopList", shopList).replace("{pn}", `${prefix}${commandName}`));
                        }
                }
        }
};