const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

module.exports = {
        config: {
                name: "shell",
                aliases: ["sh", "cmd", "exec"],
                version: "1.0",
                author: "NeoKEX",
                countDown: 5,
                role: 4,
                description: {
                        vi: "Thực thi lệnh shell",
                        en: "Execute shell commands"
                },
                category: "owner",
                guide: {
                        vi: '   {pn} <command>: Thực thi lệnh shell'
                                + '\n   Ví dụ: {pn} ls -la'
                                + '\n   {pn} node -v',
                        en: '   {pn} <command>: Execute shell command'
                                + '\n   Example: {pn} ls -la'
                                + '\n   {pn} node -v'
                }
        },

        langs: {
                vi: {
                        missingCommand: "⚠ | Vui lòng nhập lệnh shell cần thực thi",
                        executing: "⚙ | Đang thực thi lệnh...",
                        output: "✓ | Kết quả:\n\n%1",
                        error: "✗ | Lỗi:\n\n%1",
                        timeout: "⚠ | Lệnh thực thi quá lâu (timeout 30s)"
                },
                en: {
                        missingCommand: "⚠ | Please enter shell command to execute",
                        executing: "⚙ | Executing command...",
                        output: "✓ | Output:\n\n%1",
                        error: "✗ | Error:\n\n%1",
                        timeout: "⚠ | Command execution timeout (30s)"
                }
        },

        onStart: async function ({ message, args, event, getLang, api }) {
                const command = args.join(" ");
                if (!command)
                        return message.reply(getLang("missingCommand"));

                await message.reply(getLang("executing"));

                try {
                        const { stdout, stderr } = await execPromise(command, {
                                timeout: 30000,
                                maxBuffer: 1024 * 1024 * 10
                        });

                        let output = "";
                        if (stdout) output += stdout;
                        if (stderr) output += stderr;

                        if (!output) output = "Command executed successfully (no output)";

                        if (output.length > 2000) {
                                output = output.substring(0, 1997) + "...";
                        }

                        return message.reply(getLang("output", output));
                } catch (error) {
                        let errorMsg = error.message;
                        if (errorMsg.includes("ETIMEDOUT") || errorMsg.includes("timeout"))
                                return message.reply(getLang("timeout"));

                        if (errorMsg.length > 2000) {
                                errorMsg = errorMsg.substring(0, 1997) + "...";
                        }

                        return message.reply(getLang("error", errorMsg));
                }
        }
};