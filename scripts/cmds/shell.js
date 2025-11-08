const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

module.exports = {
        config: {
                name: "shell",
                version: "1.0",
                author: "NeoKEX",
                countDown: 5,
                role: 2,
                description: {
                        vi: "Thực thi lệnh shell",
                        en: "Execute shell commands"
                },
                category: "owner",
                guide: {
                        vi: "   {pn} <lệnh shell>"
                                + "\n   Ví dụ:"
                                + "\n    {pn} ls -la"
                                + "\n    {pn} pwd"
                                + "\n    {pn} node -v",
                        en: "   {pn} <shell command>"
                                + "\n   Example:"
                                + "\n    {pn} ls -la"
                                + "\n    {pn} pwd"
                                + "\n    {pn} node -v"
                }
        },

        langs: {
                vi: {
                        noCommand: "❌ Vui lòng nhập lệnh shell cần thực thi"
                },
                en: {
                        noCommand: "❌ Please enter a shell command to execute"
                }
        },

        onStart: async function ({ args, message, getLang }) {
                const command = args.join(" ");
                
                if (!command) {
                        return message.reply(getLang("noCommand"));
                }

                try {
                        const { stdout, stderr } = await execPromise(command, {
                                timeout: 60000,
                                maxBuffer: 1024 * 1024 * 10
                        });

                        let output = "";
                        if (stdout) output += stdout;
                        if (stderr) output += stderr;

                        if (!output) output = "Command executed successfully with no output.";

                        if (output.length > 2000) {
                                output = output.substring(0, 1997) + "...";
                        }

                        await message.reply(output);
                } catch (err) {
                        let errorMsg = err.message || err.toString();
                        
                        if (err.stdout) errorMsg += `\n\nStdout: ${err.stdout}`;
                        if (err.stderr) errorMsg += `\n\nStderr: ${err.stderr}`;

                        if (errorMsg.length > 2000) {
                                errorMsg = errorMsg.substring(0, 1997) + "...";
                        }

                        await message.reply(errorMsg);
                }
        }
};
