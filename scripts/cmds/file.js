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

        onStart: async function ({ args, message }) {
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
                        return message.reply("❌ Command not found");
                }

                // Get the actual command file name
                const actualCommandName = command.config.name;
                const filePath = path.join(__dirname, `${actualCommandName}.js`);

                try {
                        if (!fs.existsSync(filePath)) {
                                return message.reply("❌ File not found");
                        }

                        const content = fs.readFileSync(filePath, "utf-8");
                        return message.reply(`${content}`);

                } catch (err) {
                        return message.reply(`❌ Error: ${err.message}`);
                }
        }
};
