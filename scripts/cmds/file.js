const fs = require("fs-extra");
const path = require("path");

module.exports = {
        config: {
                name: "file",
                aliases: [],
                version: "1.0",
                author: "NeoKEX",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Xem mã nguồn của một lệnh cụ thể",
                        en: "View the source code of a specific command"
                },
                category: "system",
                guide: {
                        vi: "   {pn} <tên lệnh>: xem mã nguồn của lệnh",
                        en: "   {pn} <command name>: view source code of the command"
                }
        },

        langs: {
                vi: {
                        notFound: "❌ Lệnh '%1' không được tìm thấy.",
                        cantRead: "❌ Không thể đọc file: %1",
                        toolong: "⚠️ File quá dài. Chỉ hiển thị %1 dòng đầu tiên:",
                        error: "❌ Lỗi: %1"
                },
                en: {
                        notFound: "❌ Command '%1' not found.",
                        cantRead: "❌ Cannot read file: %1",
                        toolong: "⚠️ File is too long. Showing first %1 lines:",
                        error: "❌ Error: %1"
                }
        },

        onStart: async function ({ args, message, event, getLang }) {
                if (!args.length) {
                        return message.SyntaxError();
                }

                const commandName = args[0].toLowerCase();
                const allCommands = global.GoatBot.commands;

                // Find the command
                let command = allCommands.get(commandName);
                if (!command) {
                        const cmd = [...allCommands.values()].find((c) =>
                                (c.config.aliases || []).includes(commandName)
                        );
                        command = cmd;
                }

                if (!command) {
                        return message.reply(getLang("notFound", commandName));
                }

                // Get the actual command file name
                const actualCommandName = command.config.name;
                const filePath = path.join(__dirname, `${actualCommandName}.js`);

                try {
                        // Check if file exists
                        if (!fs.existsSync(filePath)) {
                                return message.reply(getLang("cantRead", filePath));
                        }

                        // Read file
                        let content = fs.readFileSync(filePath, "utf-8");
                        const totalLines = content.split("\n").length;

                        // Limit to first 100 lines if too long
                        const maxLines = 100;
                        let displayContent = content;
                        let isTruncated = false;

                        if (totalLines > maxLines) {
                                displayContent = content.split("\n").slice(0, maxLines).join("\n");
                                isTruncated = true;
                        }

                        // Create code block with markdown formatting
                        let response = `📄 **${actualCommandName}.js** (${totalLines} lines)\n`;
                        response += `\`\`\`javascript\n${displayContent}\n\`\`\``;

                        if (isTruncated) {
                                response = getLang("toolong", maxLines) + "\n\n" + response;
                        }

                        // Send the file content
                        return message.reply(response);

                } catch (err) {
                        return message.reply(getLang("error", err.message));
                }
        }
};
