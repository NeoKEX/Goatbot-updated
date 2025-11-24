const fs = require("fs-extra");

module.exports = {
        config: {
                name: "restart",
                version: "1.1",
                author: "NTKhang",
                countDown: 5,
                role: 2,
                description: {
                        vi: "Khởi động lại bot",
                        en: "Restart bot"
                },
                category: "Owner",
                guide: {
                        vi: "   {pn}: Khởi động lại bot",
                        en: "   {pn}: Restart bot"
                }
        },

        langs: {
                vi: {
                        restartting: "🔄 | Đang khởi động lại bot..."
                },
                en: {
                        restartting: "🔄 | Restarting bot..."
                }
        },

        onLoad: function ({ api }) {
                if (!api) return;
                
                const pathFile = `${__dirname}/tmp/restart.txt`;
                if (fs.existsSync(pathFile)) {
                        try {
                                const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");
                                const restartTime = (Date.now() - parseInt(time)) / 1000;
                                // Delay sending message to ensure API is ready
                                setTimeout(() => {
                                        try {
                                                api.sendMessage(`✓ | Bot restarted\n⏰ | Time: ${restartTime.toFixed(2)}s`, parseInt(tid));
                                        } catch (err) {
                                                console.error("Error sending restart notification:", err);
                                        }
                                }, 2000);
                                fs.unlinkSync(pathFile);
                        } catch (err) {
                                console.error("Error in restart onLoad:", err);
                                try {
                                        fs.unlinkSync(pathFile);
                                } catch (e) {}
                        }
                }
        },

        onStart: async function ({ message, event, getLang }) {
                const pathFile = `${__dirname}/tmp/restart.txt`;
                fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);
                await message.reply(getLang("restartting"));
                process.exit(2);
        }
};