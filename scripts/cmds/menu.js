module.exports = {
  config: {
    name: "menu",
    aliases: ["help2", "commands"],
    version: "2.0",
    author: "nexo_here",
    shortDescription: "Show all available commands",
    longDescription: "Display a categorized list of all available commands.",
    category: "system",
    guide: "{pn} [command name]"
  },

  onStart: async function ({ message, args, event, commandName, prefix }) {
    const allCommands = global.GoatBot.commands;
    const categories = {};

    for (const [name, cmd] of allCommands) {
      const cat = cmd.config.category || "others";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({
        name: cmd.config.name,
        desc: cmd.config.shortDescription || ""
      });
    }

    if (args[0]) {
      const query = args[0].toLowerCase();
      const cmd = allCommands.get(query) || [...allCommands.values()].find(c => c.config.aliases?.includes(query));
      if (!cmd) return message.reply(`❌ Command "${query}" not found.`);

      const { name, description, category, guide, author, version, aliases } = cmd.config;
      return message.reply(
        `✨ Command Information:\n` +
        `• Name: ${name}\n` +
        `• Description: ${description || "No description"}\n` +
        `• Category: ${category}\n` +
        `• Aliases: ${aliases?.join(", ") || "None"}\n` +
        `• Version: ${version}\n` +
        `• Author: ${author}\n\n` +
        `📘 Usage:\n${guide.replace(/{pn}/g, prefix + name)}`
      );
    }

    const emojiMap = {
      "system": "🛠️",
      "AI-IMAGE": "🏜️",
      "info": "ℹ️",
      "fun": "🎉",
      "media": "🎬",
      "economy": "💰",
      "games": "🎮",
      "tools": "🧰",
      "others": "📁"
    };

    let msg = "📜 Help Menu\nHere are the available commands:\n\n";

    for (const cat of Object.keys(categories).sort()) {
      msg += `${emojiMap[cat] || "📁"} ${capitalize(cat)}:\n`;
      const cmds = categories[cat]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => `• ${c.name}${c.desc}`);
      msg += cmds.join("\n") + "\n\n";
    }

    msg += `💡 Tip: Type "${prefix}help [command]" to view detailed info.`;
    return message.reply(msg);
  }
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
      }