module.exports = {
        config: {
                name: "demo",
                aliases: ["moneydemo"],
                version: "1.0",
                author: "NeoKEX",
                countDown: 5,
                role: 0,                    // Anyone can use (no role requirement)
                requiredMoney: 1000,        // But they need $1000 balance
                description: {
                        vi: "Lệnh demo - yêu cầu $1000 để sử dụng (không cần role đặc biệt)",
                        en: "Demo command - requires $1000 to use (no special role needed)"
                },
                category: "demo",
                guide: {
                        vi: '   {pn}: Xem thông tin demo về hệ thống yêu cầu tiền',
                        en: '   {pn}: View demo information about the money requirement system'
                }
        },

        langs: {
                vi: {
                        success: "✓ Chúc mừng!\n━━━━━━━━━━━━━━━\nBạn đã truy cập thành công lệnh demo!\n\n✎ Thông tin:\n• Số dư của bạn: $%1\n• Yêu cầu: $1000\n• Trạng thái: ✓ Đủ điều kiện\n\n⚠ Lưu ý: Lệnh này không yêu cầu role đặc biệt, chỉ cần đủ tiền!\n━━━━━━━━━━━━━━━"
                },
                en: {
                        success: "✓ Congratulations!\n━━━━━━━━━━━━━━━\nYou successfully accessed the demo command!\n\n✎ Information:\n• Your balance: $%1\n• Required: $1000\n• Status: ✓ Eligible\n\n⚠ Note: This command doesn't require a special role, just enough money!\n━━━━━━━━━━━━━━━"
                }
        },

        onStart: async function ({ message, usersData, event, getLang }) {
                const userData = await usersData.get(event.senderID);
                const userMoney = userData.money || 0;
                
                return message.reply(getLang("success", userMoney));
        }
};