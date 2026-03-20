const axios = require('axios');
const fs = require('fs-extra');

const baseApiUrl = async () => "https://baby-apisx.vercel.app";

module.exports.config = {
    name: "bby",
    aliases: ["baby"],
    version: "0.0.1",
    author: "Nc-ArYAN",
    countDown: 0,
    role: 0,
    description: "Update SimSims API by Aryan Rayhan",
    guide: {
        en: `{pn} [anyMessage] OR
teach [YourMessage] - [Reply1], [Reply2], ... OR
teach react [YourMessage] - [react1], [react2], ... OR
remove [YourMessage] OR rm [YourMessage] - [index] OR
msg [YourMessage] OR list OR all OR
edit [YourMessage] - [NewReply]`
    }
};

module.exports.ncStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const uid = event.senderID;
    const input = args.join(" ").toLowerCase();

    try {
        if (!args[0]) {
            const defaults = ["Bolo baby", "hum", "type help baby", "type !baby hi"];
            return api.sendMessage(defaults[Math.floor(Math.random() * defaults.length)], event.threadID, event.messageID);
        }

        // REMOVE / RM
        if (["remove", "rm"].includes(args[0])) {
            const rest = input.replace(`${args[0]} `, "").trim();
            if (!rest) return api.sendMessage('❌ Format: remove [message] OR rm [message] - [index]', event.threadID, event.messageID);

            const url = rest.includes('-')
                ? `${link}?remove=${encodeURIComponent(rest.split('-')[0].trim())}&index=${rest.split('-')[1].trim()}&senderID=${uid}`
                : `${link}?remove=${encodeURIComponent(rest)}&senderID=${uid}`;

            const resp = (await axios.get(url)).data.message;
            return api.sendMessage(resp, event.threadID, event.messageID);
        }

        // LIST / ALL
        if (args[0] === 'list') {
            if (args[1] === 'all') {
                const data = (await axios.get(`${link}?list=all`)).data;
                const limit = parseInt(args[2]) || 100;
                const teachers = await Promise.all(
                    data.teacher.teacherList.slice(0, limit).map(async (item) => {
                        const number = Object.keys(item)[0];
                        const value = item[number];
                        const name = await usersData.getName(number).catch(() => number) || "Not found";
                        return { name, value };
                    })
                );
                teachers.sort((a,b) => b.value - a.value);
                const output = teachers.map((t,i) => `${i+1}/ ${t.name}: ${t.value}`).join('\n');
                return api.sendMessage(`Total Teach = ${data.length}\n👑 List of Teachers:\n${output}`, event.threadID, event.messageID);
            } else {
                const d = (await axios.get(`${link}?list=all`)).data;
                return api.sendMessage(`❇️ Total Teach = ${d.length || "API off"}\n♻️ Total Response = ${d.responseLength || "API off"}`, event.threadID, event.messageID);
            }
        }

        // MSG
        if (args[0] === 'msg') {
            const query = input.replace("msg ", "");
            const data = (await axios.get(`${link}?list=${query}`)).data.data;
            return api.sendMessage(`Message ${query} = ${data}`, event.threadID, event.messageID);
        }

        // EDIT
        if (args[0] === 'edit') {
            if (!input.includes('-')) return api.sendMessage('❌ Invalid format! Use: edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
            const [key, newReply] = input.replace("edit ", "").split(/\s*-\s*/).map(s => s.trim());
            if (!key || !newReply) return api.sendMessage('❌ Invalid format! Use: edit [YourMessage] - [NewReply]', event.threadID, event.messageID);

            const resp = (await axios.get(`${link}?edit=${encodeURIComponent(key)}&replace=${encodeURIComponent(newReply)}&senderID=${uid}`)).data.message;
            return api.sendMessage(resp, event.threadID, event.messageID);
        }

        // TEACH
        if (args[0] === 'teach') {
            let finalKey, replies;
            if (args[1] === 'react') {
                [finalKey, replies] = input.replace("teach react ", "").split(/\s*-\s*/);
                if (!replies) return api.sendMessage('❌ Invalid format!', event.threadID, event.messageID);
                const resp = (await axios.get(`${link}?teach=${finalKey}&react=${replies}`)).data.message;
                return api.sendMessage(`✅ Replies added ${resp}`, event.threadID, event.messageID);
            } else if (args[1] === 'amar') {
                [finalKey, replies] = input.replace("teach ", "").split(/\s*-\s*/);
                const resp = (await axios.get(`${link}?teach=${finalKey}&senderID=${uid}&reply=${replies}&key=intro`)).data.message;
                return api.sendMessage(`✅ Replies added ${resp}`, event.threadID, event.messageID);
            } else {
                [finalKey, replies] = input.replace("teach ", "").split(/\s*-\s*/);
                if (!replies) return api.sendMessage('❌ Invalid format!', event.threadID, event.messageID);
                const resp = (await axios.get(`${link}?teach=${finalKey}&reply=${replies}&senderID=${uid}&threadID=${event.threadID}`)).data.message;
                const teacherName = (await usersData.getName(uid).catch(() => "Unknown")) || "Unknown";
                return api.sendMessage(`✅ Replies added ${resp}\nTeacher: ${teacherName}`, event.threadID, event.messageID);
            }
        }

        // SPECIAL NAME CHECKS
        if (/amar name ki|amr nam ki|amar nam ki|amr name ki|whats my name/.test(input)) {
            const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
            return api.sendMessage(data, event.threadID, event.messageID);
        }

        // DEFAULT REPLY
        const data = (await axios.get(`${link}?text=${encodeURIComponent(input)}&senderID=${uid}&font=1`)).data.reply;
        api.sendMessage(data, event.threadID, (err, info) => {
            global.noobCore.ncReply.set(info.messageID, {
                commandName: this.config.name,
                type: "reply",
                messageID: info.messageID,
                author: uid,
                reply: data,
                apiUrl: link
            });
        }, event.messageID);

    } catch (err) {
        console.error(err);
        api.sendMessage("❌ Check console for error", event.threadID, event.messageID);
    }
};

module.exports.ncReply = async ({ api, event }) => {
    try {
        if (event.type === "message_reply") {
            const reply = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}&font=1`)).data.reply;
            await api.sendMessage(reply, event.threadID, (err, info) => {
                global.noobCore.ncReply.set(info.messageID, {
                    commandName: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    reply
                });
            }, event.messageID);
        }
    } catch (err) {
        api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
};

module.exports.ncPrefix = async ({ api, event }) => {
    try {
        const body = event.body?.toLowerCase() || "";
        if (/^(baby|bby|bot|jan|babu|janu)/.test(body)) {
            const message = body.replace(/^\S+\s*/, "");
            if (!message) {
                const defaults = ["😚", "Yes 😀, I am here", "What's up?", "Bolo jaan ki korte panmr jonno"];
                return api.sendMessage(defaults[Math.floor(Math.random() * defaults.length)], event.threadID, event.messageID);
            }
            const reply = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(message)}&senderID=${event.senderID}&font=1`)).data.reply;
            return api.sendMessage(reply, event.threadID, (err, info) => {
                global.noobCore.ncReply.set(info.messageID, {
                    commandName: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    reply
                });
            }, event.messageID);
        }
    } catch (err) {
        api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
};
