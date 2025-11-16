const fs = require("fs-extra");
const path = require("path");

const { configCommands } = global.GoatBot;

module.exports = {
        config: {
                name: "delete",
                aliases: ["remove", "delcmd"],
                version: "1.1", // Updated version
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
                        partialSuccess: "✓ Đã xóa (%1) lệnh thành công.\n\n× Thất bại (%2) lệnh:\n%3", // Improved message
                        notDeleted: "× Không thể xóa (%1) lệnh:\n%2"
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
                        partialSuccess: "✓ Successfully deleted (%1) commands.\n\n× Failed (%2) commands:\n%3", // Improved message
                        notDeleted: "× Failed to delete (%1) commands:\n%2"
                }
        },

        onStart: async function ({ args, message, event, commandName, getLang }) {
                if (!args[0])
                        return message.reply(getLang("missingCommandName"));

                const commandsToDelete = args.map(arg => arg.replace(/\.js$/i, '').toLowerCase());
                const validCommands = [];
                const notFoundCommands = [];
                const protectedCommands = ["delete", "cmd", "help", "menu", "eval", commandName]; // Added 'menu' and 'delete' itself

                // Check which commands exist and can be deleted
                for (const cmdName of commandsToDelete) {
                        const cmdPath = path.join(__dirname, `${cmdName}.js`);
                        
                        if (protectedCommands.includes(cmdName)) { // Corrected check
                                notFoundCommands.push({ name: cmdName, reason: getLang("cannotDelete", cmdName) });
                                continue;
                        }

                        // Check if command is loaded and file exists
                        if (global.GoatBot.commands.has(cmdName) && fs.existsSync(cmdPath)) {
                                validCommands.push(cmdName);
                        } else {
                                notFoundCommands.push({ name: cmdName, reason: getLang("notFound", cmdName) });
                        }
                }

                // If no valid commands found
                if (validCommands.length === 0) {
                        const reasons = notFoundCommands.map(c => c.reason).join("\n");
                        return message.reply(reasons);
                }

                // Ask for confirmation
                const confirmMsg = validCommands.length === 1
                        ? getLang("confirmDelete", validCommands[0])
                        : getLang("confirmDeleteMultiple", validCommands.length, validCommands.map(c => `  • ${c}`).join("\n