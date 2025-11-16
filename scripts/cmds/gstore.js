 
const axios = require("axios");
const fs = require('fs');
const path = require('path');
const GoatStor = "https://goatstor.vercel.app";

module.exports = {
  config: {
    name: "goatstor",
    aliases: ["gs", "market"],
    version: "0.0.1",
    role: 2,
    author: "ArYAN",
    shortDescription: {
      en: "📌 Goatstor - Your Command Marketplace"
    },
    longDescription: {
      en: "📌 Browse, search, upload, and manage your commands in the GoatStor marketplace with easy sharing cmds."
    },
    category: "market",
    cooldowns: 0,
  },

  onStart: async ({ api, event, args, message }) => {
    const sendBeautifulMessage = (content) => {
      const header = "╭──『 𝐆𝐨𝐚𝐭𝐒𝐭𝐨𝐫 』──╮\n";
      const footer = "\n╰─────────────╯";
      return message.reply(header + content + footer);
    };

    try {
      if (!args[0]) {
        return sendBeautifulMessage(
          "\n" +
          `╭─❯ ${event.body} show <ID>\n├ 📦 Get command code\n╰ Example: show 1\n\n` +
          `╭─❯ ${event.body} page <number>\n├ 📄 Browse commands\n╰ Example: page 1\n\n` +
          `╭─❯ ${event.body} search <query>\n├ 🔍 Search commands\n╰ Example: search music\n\n` +
          `╭─❯ ${event.body} trending\n├ 🔥 View trending\n╰ Most popular commands\n\n` +
          `╭─❯ ${event.body} stats\n├ 📊 View statistics\n╰ Marketplace insights\n\n` +
          `╭─❯ ${event.body} like <ID>\n├ 💝 Like a command\n╰ Example: like 1\n\n` +
          `╭─❯ ${event.body} upload <name>\n├ ⬆️ Upload command\n╰ Example: upload goatStor\n\n` +
          "💫 𝗧𝗶𝗽: 𝐔𝐬𝐞 '𝐡𝐞𝐥𝐩 𝐠𝐨𝐚𝐭𝐦𝐚𝐫𝐭' 𝐟𝐨𝐫 𝐝𝐞𝐭𝐚𝐢𝐥𝐬"
        );
      }

      const command = args[0].toLowerCase();

      switch (command) {
        case "show": {
          const itemID = parseInt(args[1]);
          if (isNaN(itemID)) return sendBeautifulMessage("\n[⚜️]➜ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐢𝐭𝐞𝐦 𝐈𝐃.");
          const response = await axios.get(`${GoatStor}/api/item/${itemID}`);
          const item = response.data;
          
          
          const bangladeshTime = new Date(item.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

          return sendBeautifulMessage(
            "\n" +
            `╭─❯  𝐍𝐚𝐦𝐞\n╰ ${item.itemName}\n\n` +
            `╭─❯ 🆔 𝐈𝐃\n╰ ${item.itemID}\n\n` +
            `╭─❯ ⚙️ 𝐓𝐲𝐩𝐞\n╰ ${item.type || 'Unknown'}\n\n` +
            `╭─❯ 👨‍💻 𝐀𝐮𝐭𝐡𝐨𝐫\n╰ ${item.authorName}\n\n` +
            `╭─❯ 🔗 𝐂𝐨𝐝𝐞\n╰ ${GoatStor}/raw/${item.rawID}\n\n` +
            `╭─❯ 📅 𝐀𝐝𝐝𝐞𝐝\n╰ ${bangladeshTime}\n\n` +
            `╭─❯ 👀 𝐕𝐢𝐞𝐰𝐬\n╰ ${item.views}\n\n` +
            `╭─❯ 💝 𝐥𝐢𝐤𝐞𝐬\n╰ ${item.likes}`
          );
        }

        case "page": {
          const page = parseInt(args[1]) || 1;
          const { data: { items, total } } = await axios.get(`${GoatStor}/api/items?page=${page}&limit=5`);
          const totalPages = Math.ceil(total / 5);
          if (page <= 0 || page > totalPages) {
            return sendBeautifulMessage("\n[⚜️]➜ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐩𝐚𝐠𝐞 𝐧𝐮𝐦𝐛𝐞𝐫.");
          }
          const itemsList = items.map((item, index) =>
            `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
            `├ 🆔 𝐈𝐃: ${item.itemID}\n` +
            `├ ⚙️ 𝐓𝐲𝐩𝐞: ${item.type}\n` +
            `├  𝐃𝐞𝐬𝐜: ${item.description}\n` +
            `╰ 👨‍💻 𝐀𝐮𝐭𝐡𝐨𝐫: ${item.authorName}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n📄 𝐏𝐚𝐠𝐞 ${page}/${totalPages}\n\n${itemsList}`);
        }

        case "search": {
          const query = args.slice(1).join(" ");
          if (!query) return sendBeautifulMessage("\n[⚜️]➜ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐬𝐞𝐚𝐫𝐜𝐡 𝐪𝐮𝐞𝐫𝐲. ");
          const { data } = await axios.get(`${GoatStor}/api/items?search=${encodeURIComponent(query)}`);
          const results = data.items;
          if (!results.length) return sendBeautifulMessage("\n× 𝐍𝐨 𝐦𝐚𝐭𝐜𝐡𝐢𝐧𝐠 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬 𝐟𝐨𝐮𝐧𝐝.");
          const searchList = results.slice(0, 5).map((item, index) =>
            `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
            `├ 🆔 𝐈𝐃: ${item.itemID}\n` +
            `├ ⚙️ 𝐓𝐲𝐩𝐞: ${item.type}\n` +
            `╰ 👨‍💻 𝐀𝐮𝐭𝐡𝐨𝐫: ${item.authorName}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n Query: "${query}"\n\n${searchList}`);
        }

        case "trending": {
          const { data } = await axios.get(`${GoatStor}/api/trending`);
          const trendingList = data.slice(0, 5).map((item, index) =>
            `╭─❯ ${index + 1}. 🔥 ${item.itemName}\n` +
            `├ 💝 𝐥𝐢𝐤𝐞𝐬: ${item.likes}\n` +
            `╰ 👀 𝐕𝐢𝐞𝐰𝐬: ${item.views}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n${trendingList}`);
        }

        case "stats": {
          const { data: stats } = await axios.get(`${GoatStor}/api/stats`);
          const { hosting, totalCommands, totalLikes, dailyActiveUsers, popularTags, topAuthors, topViewed } = stats;
          const uptimeStr = `${hosting?.uptime?.years}y ${hosting?.uptime?.months}m ${hosting?.uptime?.days}d ${hosting?.uptime?.hours}h ${hosting?.uptime?.minutes}m ${hosting?.uptime?.seconds}s`;
          const tagList = popularTags.map((tag, i) =>
            `${i + 1}. ${tag._id || 'Unknown'} (${tag.count})`
          ).join('\n');
          const authorList = topAuthors.map((a, i) =>
            `${i + 1}. ${a._id || 'Unknown'} (${a.count})`
          ).join('\n');
          const viewedList = topViewed.map((v, i) =>
            `${i + 1}. ${v.itemName} 𝐈𝐃: ${v.itemID}\n 𝐕𝐢𝐞𝐰𝐬: ${v.views}`
          ).join('\n\n');
          return sendBeautifulMessage(
            `\n╭─❯ 📦 𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬\n╰ ${totalCommands}\n\n` +
            `╭─❯ 💝 𝐓𝐨𝐭𝐚𝐥 𝐋𝐢𝐤𝐞𝐬\n╰ ${totalLikes}\n\n` +
            `╭─❯  𝐃𝐚𝐢𝐥𝐲 𝐔𝐬𝐞𝐫𝐬\n╰ ${dailyActiveUsers}\n\n` +
            `╭─❯  𝐓𝐨𝐩 𝐀𝐮𝐭𝐡𝐨𝐫𝐬\n╰${authorList}\n\n` +
            `╭─❯ 🔥 𝐓𝐨𝐩 𝐕𝐢𝐞𝐰𝐞𝐝\n╰${viewedList}\n\n` +
            `╭─❯ 🏷️ 𝐏𝐨𝐩𝐮𝐥𝐚𝐫 𝐓𝐚𝐠𝐬\n╰${tagList}\n\n` +
            `      🌐 𝐇𝐨𝐬𝐭𝐢𝐧𝐠 𝐈𝐧𝐟𝐨\n\n` +
            `╭─❯ ⏰ 𝐔𝐩𝐭𝐢𝐦𝐞\n╰ ${uptimeStr}\n\n` +
            `╭─❯ 💻 𝐒𝐲𝐬𝐭𝐞𝐦\n` +
            `├ 🔧 ${hosting.system.platform} (${hosting.system.arch})\n` +
            `├ 📌 Node ${hosting.system.nodeVersion}\n` +
            `╰ 🖥️ CPU Cores: ${hosting.system.cpuCores}`
          );
        }

        case "like": {
          const likeItemId = parseInt(args[1]);
          if (isNaN(likeItemId)) return sendBeautifulMessage("\n[!]➜ Please provide a valid item ID.");
          const { data } = await axios.post(`${GoatStor}/api/items/${likeItemId}/like`);
          if (data.success) {
            return sendBeautifulMessage(
              `\n╭─❯ ✨ 𝐒𝐭𝐚𝐭𝐮𝐬\n╰ liked!\n\n╭─❯ 💝 𝐓𝐨𝐭𝐚𝐥 𝐋𝐢𝐤𝐞𝐬\n╰ ${data.likes}`
            );
          } else {
            return sendBeautifulMessage("\n[⚜️]➜ Failed to like command.");
          }
        }

        case "upload": {
          const commandName = args[1];
          if (!commandName) return sendBeautifulMessage("\n[⚜️]➜ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐧𝐚𝐦𝐞.");
          const commandPath = path.join(process.cwd(), 'scripts', 'cmds', `${commandName}.js`);
          if (!fs.existsSync(commandPath)) return sendBeautifulMessage(`\n× File '${commandName}.js' not found.`);
          try {
            const code = fs.readFileSync(commandPath, 'utf8');
            let commandFile;
            try {
              commandFile = require(commandPath);
            } catch (err) {
              return sendBeautifulMessage("\n[⚜️]➜  Invalid command file format.");
            }
            const uploadData = {
              itemName: commandFile.config?.name || commandName,
              description: commandFile.config?.longDescription?.en || commandFile.config?.shortDescription?.en || "No description",
              type: "GoatBot",
              code,
              authorName: commandFile.config?.author || event.senderID || "Unknown"
            };
            const response = await axios.post(`${GoatStor}/v1/paste`, uploadData);
            if (response.data.success) {
              const { itemID, link } = response.data;
              return sendBeautifulMessage(
                "\n" +
                `╭─❯ ✓ 𝐒𝐭𝐚𝐭𝐮𝐬\n╰ Command uploaded !\n\n` +
                `╭─❯  𝐍𝐚𝐦𝐞\n╰ ${uploadData.itemName}\n\n` +
                `╭─❯ 🆔 𝐈𝐃\n╰ ${itemID}\n\n` +
                `╭─❯ 👨‍💻 𝐀𝐮𝐭𝐡𝐨𝐫\n╰ ${uploadData.authorName}\n\n`  +
                `╭─❯ 🔗 𝐂𝐨𝐝𝐞\n╰ ${link}`
              );
            }
            return sendBeautifulMessage("\n[⚜️]➜ Failed to upload the command.");
          } catch (error) {
            console.error("Upload error:", error);
            return sendBeautifulMessage("\n[⚜️]➜ An unexpected error occurred during upload.");
          }
        }

        default:
          return sendBeautifulMessage("\n[⚜️]➜ Invalid subcommand. Use `help GoatStor` for options.");
      }
    } catch (err) {
      console.error("GoatStor Error:", err);
      return sendBeautifulMessage("\n[⚜️]➜ An unexpected error occurred. Please check the console for details.");
    }
  }
};