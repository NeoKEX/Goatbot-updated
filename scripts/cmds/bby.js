const axios = require('axios');

const baseApiUrl = async () => "https://baby-apisx.vercel.app";

module.exports = {
  config: {
    name: "bby",
    aliases: ["baby"],
    version: "0.0.2",
    author: "Nc-ArYAN", 
    countDown: 0,
    role: 0,
    description: "Update SimSim AI chat API by Aryan Rayhan",
    guide: {
      en: "{pn} [message] OR\nteach [message] - [reply1], [reply2]... OR\nremove [message] - [index] OR\nlist OR all OR edit [message] - [new reply]"
    }
  },

  ncStart: async ({ api, event, args, usersData }) => {
    try {
      const uid = event.senderID;
      const link = `${await baseApiUrl()}/baby`;
      const text = args.join(" ").toLowerCase();

      if (!text) {
        const replies = ["Bolo baby", "Hum?", "Type help baby", "Type !baby hi"];
        return api.sendMessage(replies[Math.floor(Math.random() * replies.length)], event.threadID, event.messageID);
      }

      // Handle teach/edit/remove/list commands
      const command = text.split(" ")[0];

      if (["remove", "rm"].includes(command)) {
        const rest = text.replace(`${command} `, "").trim();
        if (!rest) return api.sendMessage('❌ Format: remove [message] OR rm [message] - [index]', event.threadID, event.messageID);

        const url = rest.includes('-') 
          ? `${link}?remove=${encodeURIComponent(rest.split('-')[0].trim())}&index=${rest.split('-')[1].trim()}&senderID=${uid}`
          : `${link}?remove=${encodeURIComponent(rest)}&senderID=${uid}`;

        const res = await axios.get(url);
        return api.sendMessage(res.data.message, event.threadID, event.messageID);
      }

      if (command === "list") {
        const allData = (await axios.get(`${link}?list=all`)).data;
        const limit = parseInt(args[1]) || 50;
        const teachers = allData.teacher?.teacherList?.slice(0, limit) || [];
        const output = await Promise.all(teachers.map(async item => {
          const id = Object.keys(item)[0];
          const name = await usersData.getName(id).catch(() => id);
          return `${name}: ${item[id]}`;
        }));
        return api.sendMessage(`Total Teach = ${allData.length}\n${output.join("\n")}`, event.threadID, event.messageID);
      }

      if (command === "edit") {
        if (!text.includes('-')) return api.sendMessage('❌ Format: edit [message] - [new reply]', event.threadID, event.messageID);
        const [key, reply] = text.replace("edit ", "").split(/\s*-\s*/);
        if (!key || !reply) return api.sendMessage('❌ Format: edit [message] - [new reply]', event.threadID, event.messageID);
        const res = await axios.get(`${link}?edit=${encodeURIComponent(key)}&replace=${encodeURIComponent(reply)}&senderID=${uid}`);
        return api.sendMessage(res.data.message, event.threadID, event.messageID);
      }

      if (command === "teach") {
        const [key, reply] = text.replace("teach ", "").split(/\s*-\s*/);
        if (!key || !reply) return api.sendMessage('❌ Format: teach [message] - [reply1, reply2...]', event.threadID, event.messageID);
        const res = await axios.get(`${link}?teach=${encodeURIComponent(key)}&reply=${encodeURIComponent(reply)}&senderID=${uid}&threadID=${event.threadID}`);
        const name = await usersData.getName(uid).catch(() => "Unknown");
        return api.sendMessage(`✅ Replies added: ${res.data.message}\nTeacher: ${name}`, event.threadID, event.messageID);
      }

      // Default: simple response
      const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderID=${uid}&font=1`);
      return api.sendMessage(res.data.reply, event.threadID, event.messageID);

    } catch (err) {
      console.error("BBY command error:", err);
      return api.sendMessage("❌ Something went wrong. Check console.", event.threadID, event.messageID);
    }
  }
};
