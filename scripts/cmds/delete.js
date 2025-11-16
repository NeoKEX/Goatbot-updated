const fs = require("fs-extra");
const path = require("path");

const { configCommands } = global.GoatBot;

module.exports = {
        config: {
                name: "delete",
                aliases: ["remove", "delcmd"],
                version: "1.0",
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
                        partialSuccess: "✓ Đã xóa (%1) lệnh\n× Thất bại (%2) lệnh:\n%3"
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
                        partialSuccess: "✓ Deleted (%1) commands\n× Failed (%2) commands:\n%3"
                }
        },

        onStart: async function ({ args, message, event, commandName, getLang }) {
                if (!args[0])
                        return message.reply(getLang("missingCommandName"));

                const commandsToDelete = args.map(arg => arg.replace(/\.js$/i, ''));
                const validCommands = [];
                const notFoundCommands = [];
                const protectedCommands = ["delete", "cmd", "help", "eval"];

                // Check which commands exist and can be deleted
                for (const cmdName of commandsToDelete) {
                        const cmdPath = path.join(__dirname, `${cmdName}.js`);
                        
                        if (protectedCommands.includes(cmdName.toLowerCase())) {
                                notFoundCommands.push(cmdName);
                                continue;
                        }

                        if (fs.existsSync(cmdPath)) {
                                validCommands.push(cmdName);
                        } else {
                                notFoundCommands.push(cmdName);
                        }
                }

                // If no valid commands found
                if (validCommands.length === 0) {
                        if (notFoundCommands.length === 1)
                                return message.reply(getLang("notFound", notFoundCommands[0]));
                        else
                                return message.reply(getLang("notFound", notFoundCommands.join(", ")));
                }

                // Ask for confirmation
                const confirmMsg = validCommands.length === 1
                        ? getLang("confirmDelete", validCommands[0])
                        : getLang("confirmDeleteMultiple", validCommands.length, validCommands.map(c => `  • ${c}`).join("\n"));

                return message.reply(confirmMsg, (err, info) => {
                        global.GoatBot.onReaction.set(info.messageID, {
                                commandName,
                                messageID: info.messageID,
                                type: "delete",
                                author: event.senderID,
                                data: {
                                        commandsToDelete: validCommands,
                                        notFoundCommands
                                }
                        });
                });
        },

        onReaction: async function ({ Reaction, message, event, getLang }) {
                const { unloadScripts } = global.utils;
                const { author, data: { commandsToDelete, notFoundCommands } } = Reaction;
                
                if (event.userID !== author)
                        return;

                const successfulDeletes = [];
                const failedDeletes = [];

                for (const cmdName of commandsToDelete) {
                        try {
                                // First unload the command from memory
                                const infoUnload = unloadScripts("cmds", cmdName, configCommands, getLang);
                                
                                // Delete the file
                                const cmdPath = path.join(__dirname, `${cmdName}.js`);
                                fs.unlinkSync(cmdPath);
                                
                                successfulDeletes.push(cmdName);
                        } catch (error) {
                                failedDeletes.push(`  • ${cmdName}: ${error.message}`);
                        }
                }

                // Build response message
                let responseMsg = "";

                if (successfulDeletes.length > 0) {
                        if (successfulDeletes.length === 1) {
                                responseMsg += getLang("deleted", successfulDeletes[0]);
                        } else {
                                responseMsg += getLang("deletedMultiple", successfulDeletes.length, successfulDeletes.map(c => `  • ${c}`).join("\n"));
                        }
                }

                if (failedDeletes.length > 0) {
                        if (responseMsg) responseMsg += "\n\n";
                        if (successfulDeletes.length > 0) {
                                responseMsg = getLang("partialSuccess", successfulDeletes.length, failedDeletes.length, failedDeletes.join("\n"));
                        } else {
                                responseMsg += failedDeletes.join("\n");
                        }
                }

                if (notFoundCommands.length > 0 && successfulDeletes.length > 0) {
                        responseMsg += `\n\n⚠️ ${getLang("notFound", notFoundCommands.join(", "))}`;
                }

                message.reply(responseMsg);
        }
};
