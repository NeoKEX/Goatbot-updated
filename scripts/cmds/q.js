module.exports = {
        config: {
                name: "fakechat",
                aliases: ["q"],
                author: "Tawsif~",//Modified by NeoKEX(for fca-neokex)
                category: "fun",
                version: "2.5 pro",
                countDown: 5,
                role: 0,
                shortDescription: "create fakechat image",
                guide: {
                        en: "<text> ++ <text> | reply | --own <texts> | --user <uid> | --attachment <image url> | --time <true or false> | --name <true or false> | blank\nSupports almost all themes"
                }
        },
        onStart: async function({
                message,
                usersData,
                threadsData,
                event,
                args,
                api
        }) {
                let prompt = args.join(" ").split("\n\n").join("##").split("\n").join("####");
                if (!prompt) {
                        return message.reply("❌ | provide a text");
                }
                let themeMode = "dark";
                if (prompt.match(/--theme/)) {
                        themeMode = (prompt.split("--theme ")[1]).split(" ")[0];
                }
                const ti = await api.getThreadInfo(event.threadID);
                
                let otc = "3874ff";
                let otcc = "ffffff";
                let tc = "3874ff";
                let bc = "1a1a1a";
                let bg = "";

                try {
                        const themeId = ti?.threadTheme?.id;
                        
                        if (themeId) {
                                const themeList = await api.theme("list", event.threadID);
                                let themeData = themeList.find(t => t.id === themeId);
                                
                                if (!themeData) {
                                        try {
                                                const fetchedTheme = await api.fetchThemeData(themeId);
                                                if (fetchedTheme) {
                                                        themeData = {
                                                                gradientColors: fetchedTheme.colors || [],
                                                                backgroundImage: fetchedTheme.backgroundImage,
                                                                inboundMessageGradientColors: fetchedTheme.colors || [],
                                                                composerInputBackgroundColor: null,
                                                                messageTextColor: null,
                                                                titleBarButtonTintColor: null
                                                        };
                                                }
                                        } catch (fetchErr) {
                                        }
                                }
                                
                                if (themeData) {
                                        const extractHex = (color) => {
                                                if (!color) return null;
                                                if (typeof color === 'string') {
                                                        let hex = color.replace(/^#/, '');
                                                        if (hex.length === 8) {
                                                                hex = hex.substring(2);
                                                        }
                                                        hex = hex.substring(0, 6);
                                                        if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
                                                                return hex;
                                                        }
                                                }
                                                return null;
                                        };
                                        
                                        if (themeData.gradientColors && themeData.gradientColors.length > 0) {
                                                const lastGradient = themeData.gradientColors[themeData.gradientColors.length - 1];
                                                otc = extractHex(lastGradient) || extractHex(themeData.titleBarButtonTintColor) || otc;
                                        } else if (themeData.titleBarButtonTintColor) {
                                                otc = extractHex(themeData.titleBarButtonTintColor) || otc;
                                        }
                                        
                                        if (themeData.messageTextColor) {
                                                otcc = extractHex(themeData.messageTextColor) || otcc;
                                        }
                                        
                                        if (themeData.inboundMessageGradientColors && themeData.inboundMessageGradientColors.length > 0) {
                                                tc = extractHex(themeData.inboundMessageGradientColors[0]) || tc;
                                        }
                                        
                                        if (themeData.composerInputBackgroundColor) {
                                                bc = extractHex(themeData.composerInputBackgroundColor) || bc;
                                        }
                                        
                                        if (themeData.backgroundImage) {
                                                bg = themeData.backgroundImage;
                                        }
                                }
                        }
                } catch (themeErr) {
                }

                let id = event.senderID;
                if (event.messageReply) {
                        if (prompt.match(/--user/)) {
                                if ((prompt.split("--user ")[1].split(" ")[0]).match(/.com/)) {
                                        try {
                                                id = await api.getUID(prompt.split("--user ")[1].split(" ")[0]);
                                        } catch (e) {
                                                message.reply("your bot is unable to fetch UID from profile link");
                                        }
                                } else {
                                        id = (prompt.split("--user ")[1]).split(" ")[0];
                                }
                        } else {
                                id = event.messageReply.senderID;
                        }
                } else if (prompt.match(/--user/)) {
                        if ((prompt.split("--user ")[1].split(" ")[0]).match(/.com/)) {
                                id = await api.getUID(prompt.split("--user ")[1].split(" ")[0]);
                        } else {
                                id = (prompt.split("--user ")[1]).split(" ")[0];
                        }
                }
                let themeID = 0;
                if (event?.messageReply?.senderID === "100063840894133" || event?.messageReply?.senderID === "100083343477138") {
                        if (event.senderID !== "100063840894133" && event.senderID !== "100083343477138") {
                                prompt = "hi guys I'm gay";
                                id = event.senderID;
                        }
                }
                if (Object.keys(await usersData.get(id)).length < 1) {
                        await usersData.refreshInfo(id);
                }
                const name = prompt?.split("--name ")[1]?.split(" ")[0] === "false" ? "" : ti?.nicknames[id] || (await usersData.getName(id)).split(" ")[0];
                const avatarUrl = await usersData.getAvatarUrl(id);
                let replyImage;
                if (event?.messageReply?.attachments[0]) {
                        replyImage = event.messageReply.attachments[0].url;
                } else if (prompt.match(/--attachment/)) {
                        replyImage = (prompt.split("--attachment ")[1]).split(" ")[0];
                }
                let time = prompt?.split("--time ")[1];
                if (time == "true" || !time) {
                        time = "true";
                } else {
                        time = "";
                }
                let ownText = false;
                if (prompt.match(/--own/)) {
                        ownText = prompt?.split("--own")[1]?.split("--")[0];
                }
                const {
                        emoji
                } = ti;
                prompt = prompt.split("--")[0];
                message.reaction("⏳", event.messageID);
                try {
                        let url = `https://tawsif.is-a.dev/fakechat/max?theme=${themeMode}&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatarUrl)}&text=${encodeURIComponent(prompt)}&time=${time}&emoji=${encodeURIComponent(emoji)}&textBg=${encodeURIComponent("#"+tc)}&ownTextBg=${encodeURIComponent("#"+otc)}&bg=${encodeURIComponent(bg)}&barColor=${encodeURIComponent("#"+bc)}&ownTextColor=${encodeURIComponent("#"+otcc)}`;
                        if (replyImage) {
                                url += `&replyImageUrl=${encodeURIComponent(replyImage)}`;
                        }
                        if (ownText) {
                                url += `&ownText=${encodeURIComponent(ownText)}`;
                        }
                        message.reply({
                                attachment: await global.utils.getStreamFromURL(url, 'gc.png')
                        });
                        message.reaction("✅", event.messageID);
                } catch (error) {
                        message.send("❌ | " + error.message);
                }
        }
}
