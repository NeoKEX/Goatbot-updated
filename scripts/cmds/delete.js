const fs = require("fs-extra");
const path = require("path");

const { configCommands } = global.GoatBot;

module.exports = {
        config: {
                name: "delete",
                aliases: ["remove", "delcmd"],
                version: "1.2",
                author: "NeoKEX",
                countDown: 5,
                role: 2,
                description: {
                        vi: "Xóa các tệp lệnh khỏi hệ thống",
                        en: "Delete command files from the system"
                },
                category: "owner",
                guide: {
                        vi: "   {pn} <tên lệnh>: Xóa một tệp lệnh\n   {pn} <tên lệnh 1> <tên lệnh 2> ...: Xóa nhiều tệp lệnh",
                        en: "   {pn} <command name>: Delete a command file\n   {pn} <command name 1> <command name 2> ...: Delete multiple command files"
                }
        },

        langs: {
                vi: {
                        missingCommandName: "⚠️ Vui lòng nhập tên lệnh bạn muốn xóa",
                        confirmDelete: "⚠️ Bạn có chắc chắn muốn xóa lệnh \"%1\" không?\nThả cảm xúc bất kì vào tin nhắn này để xác nhận xóa",
                        confirmDeleteMultiple: "⚠️ Bạn có chắc chắn muốn xóa %1 lệnh không?\n%2\nThả cảm xúc bất kì vào tin nhắn này để xác nhận xóa",
                        deleted: "✓ Đã xóa lệnh \"%1\" thành công",
                        deletedMultiple: "✓ Đã xóa thành công (%1) lệnh:\n%2",
                        deletedError: "× Xóa lệnh \"%1\" thất bại với lỗi: %2",
                        notFound: "× Không tìm thấy tệp lệnh \"%1\"",
                        cannotDelete: "× Không thể xóa lệnh \"%1\" (lệnh hệ thống được bảo vệ)",
                        partialSuccess: "✓ Đã xóa (%1) lệnh thành công.\n\n× Thất bại (%2) lệnh:\n%3",
                        notDeleted: "× Xóa ব্যর্থ (%1) lệnh:\n%2"
                },
                en: {
                        missingCommandName: "⚠️ Please enter the command name you want to delete",
                        confirmDelete: "⚠️ Are you sure you want to delete the command \"%1\"?\nReact to this message to confirm deletion",
                        confirmDeleteMultiple: "⚠️ Are you sure you want to delete %1 commands?\n%2\nReact to this message to confirm deletion",
                        deleted: "✓ Successfully deleted command \"%1\"",
                        deletedMultiple: "✓ Successfully deleted (%1) commands:\n%2",
                        deletedError: "× Failed to delete command \"%1\" with error: %2",
                        notFound: "× Command file \"%1\" not found",
                        cannotDelete: "× Cannot delete command \"%1\" (protected system command)",
                        partialSuccess: "✓ Successfully deleted (%1) commands.\n\n× Failed (%2) commands:\n%3",
                        notDeleted: "× Failed to delete (%1) commands:\n%2"
                }
        },

        onStart: async function ({ args, message, event, commandName, getLang }) {
                if (!args[0])
                        return message.reply(getLang("missingCommandName"));

                const commandsToDelete = args.map(arg => arg.replace(/\.js$/i, ''));
                const validCommands = [];
                const notFoundCommands = [];
                const protectedCommands = ["delete", "remove", "delcmd", "cmd", "help", "menu", "eval", commandName];

                for (const cmdName of commandsToDelete) {
                        const cmdNameLower = cmdName.toLowerCase();
                        const cmdPath = path.join(__dirname, `${cmdNameLower}.js`);

                        if (protectedCommands.includes(cmdNameLower)) {
                                notFoundCommands.push({ name: cmdName, reason: getLang("cannotDelete", cmdName) });
                                continue;
                        }

                        if (fs.existsSync(cmdPath)) {
                                validCommands.push(cmdNameLower);
                        } else {
                                notFoundCommands.push({ name: cmdName, reason: getLang("notFound", cmdName) });
                        }
                }

                if (validCommands.length === 0) {
                        const reasons = notFoundCommands.map(c => c.reason).join("\n");
                        return message.reply(reasons);
                }

                const confirmMsg = validCommands.length === 1
                        ? getLang("confirmDelete", commandsToDelete.find(c => c.toLowerCase() === validCommands[0]))
                        : getLang("confirmDeleteMultiple", validCommands.length, commandsToDelete.filter(c => validCommands.includes(c.toLowerCase())).map(c => `  • ${c}`).join("\n"));

                return message.reply(confirmMsg, (err, info) => {
                        global.GoatBot.onReaction.set(info.messageID, {
                                commandName,