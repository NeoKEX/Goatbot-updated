const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

module.exports = {
        config: {
                name: "shell",
                aliases: ["sh", "exec"],
                version: "1.0",
                author: "NeoKEX",
                countDown: 10,
                role: 4,
                description: {
                        vi: "Thực thi lệnh shell (chỉ dành cho nhà phát triển)",
                        en: "Execute shell commands (developers only)"
                },
                category: "developer",
                guide: {
                        vi: '   {pn} <command>: Thực thi lệnh shell',
                        en: '   {pn} <command>: Execute shell command'
                }
        },

        langs: {
                vi: {
                        missingCommand: "⚠️ Vui lòng nhập lệnh cần thực thi",
                        executing: "⏳ Đang thực thi...",
                        success: "✅ Kết quả:\n\n%1",
                        error: "❌ Lỗi:\n\n%1",
                        timeout: "⏱️ Lệnh vượt quá thời gian cho phép (30s)"
                },
                en: {
                        missingCommand: "⚠️ Please enter command to execute",
                        executing: "⏳ Executing...",
                        success: "✅ Output:\n\n%1",
                        error: "❌ Error:\n\n%1",
                        timeout: "⏱️ Command exceeded timeout (30s)"
                }
        },

        onStart: async function ({ message, args, getLang, event, role }) {
                const botDevelopers = global.GoatBot.config.botDevelopers || [];
                if (!botDevelopers.includes(event.senderID) || role !== 4)
                        return message.reply("🔒 Access denied. This command is restricted to verified bot developers only.");
                
                if (args.length === 0)
                        return message.reply(getLang("missingCommand"));
                
                const command = args.join(" ");
                
                const forbiddenPatterns = [
                        /rm\s+-rf\s+\/[^/\s]*/gi,
                        /:\(\)\{\s*:\|:&\s*\};:/gi,
                        /mkfs/gi,
                        /dd\s+if=/gi,
                        />\/dev\/(sd|hd|nvme)/gi,
                        /chmod\s+777/gi
                ];
                
                for (const pattern of forbiddenPatterns) {
                        if (pattern.test(command))
                                return message.reply("⛔ Dangerous command detected and blocked.");
                }
                
                await message.reply(getLang("executing"));
                
                try {
                        const { stdout, stderr } = await execPromise(command, {
                                timeout: 30000,
                                maxBuffer: 1024 * 1024,
                                env: { ...process.env, NODE_ENV: "shell_execution" }
                        });
                        
                        let output = stdout || stderr || "Command executed successfully with no output";
                        
                        if (output.length > 2000)
                                output = output.substring(0, 2000) + "\n... (truncated)";
                        
                        const redactedOutput = output
                                .replace(/([A-Za-z0-9+/=]{40,})/g, "[REDACTED_SECRET]")
                                .replace(/(password|token|key|secret|api[-_]?key)[\s:=]+[^\s]*/gi, "$1=[REDACTED]");
                        
                        return message.reply(getLang("success", redactedOutput));
                } catch (err) {
                        if (err.killed)
                                return message.reply(getLang("timeout"));
                        
                        let errorMsg = err.message || err.stderr || err.toString();
                        
                        if (errorMsg.length > 2000)
                                errorMsg = errorMsg.substring(0, 2000) + "\n... (truncated)";
                        
                        return message.reply(getLang("error", errorMsg));
                }
        }
};