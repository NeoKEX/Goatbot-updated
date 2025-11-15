module.exports = {
  config: {
    name: "theme",
    aliases: ["aitheme"],
    version: "2.0",
    author: "NeoKEX",
    countDown: 5,
    role: 1,
    description: {
      vi: "Tạo và áp dụng chủ đề AI cho nhóm chat",
      en: "Create and apply AI themes for chat group"
    },
    category: "box chat",
    guide: {
      vi: "   {pn} <mô tả>: Tạo chủ đề AI và xem xem trước"
        + "\n   {pn} apply <ID>: Áp dụng chủ đề bằng ID"
        + "\n   Ví dụ: {pn} ocean sunset with purple and pink colors"
        + "\n   Sau đó trả lời tin nhắn với số để chọn chủ đề",
      en: "   {pn} <description>: Create AI theme and preview"
        + "\n   {pn} apply <ID>: Apply theme by ID"
        + "\n   Example: {pn} ocean sunset with purple and pink colors"
        + "\n   Then reply to the message with a number to select theme"
    }
  },

  langs: {
    vi: {
      missingPrompt: "⚠️ | Vui lòng nhập mô tả cho chủ đề AI hoặc ID chủ đề để áp dụng\n\nVí dụ:\n• {pn} ocean sunset colors\n• {pn} apply 739785333579430",
      generating: "🎨 | Đang tạo chủ đề AI, vui lòng chờ...",
      preview: "✨ | Đã tạo %1 chủ đề AI!\n\nMô tả: %2\n\n%3\n\n💡 Trả lời tin nhắn này với số (1-%1) để áp dụng chủ đề",
      themeInfo: "%1. ID: %2\n   Màu gradient: %3\n   Phong cách: AI Generated",
      applying: "🎨 | Đang áp dụng chủ đề...",
      applied: "✅ | Đã áp dụng chủ đề thành công!",
      error: "❌ | Đã xảy ra lỗi:\n%1",
      applyError: "❌ | Đã xảy ra lỗi khi áp dụng chủ đề:\n%1",
      noThemes: "⚠️ | Không thể tạo chủ đề với mô tả này, vui lòng thử mô tả khác",
      invalidSelection: "⚠️ | Vui lòng nhập số từ 1 đến %1",
      notAuthor: "⚠️ | Chỉ người tạo yêu cầu mới có thể chọn chủ đề",
      missingThemeId: "⚠️ | Vui lòng nhập ID chủ đề\nVí dụ: {pn} apply 739785333579430",
      applyingById: "🎨 | Đang áp dụng chủ đề ID: %1...",
      appliedById: "✅ | Đã áp dụng chủ đề ID: %1 thành công!"
    },
    en: {
      missingPrompt: "⚠️ | Please enter a description for AI theme or theme ID to apply\n\nExamples:\n• {pn} ocean sunset colors\n• {pn} apply 739785333579430",
      generating: "🎨 | Generating AI themes, please wait...",
      preview: "✨ | Generated %1 AI theme(s)!\n\nDescription: %2\n\n%3\n\n💡 Reply to this message with a number (1-%1) to apply the theme",
      themeInfo: "%1. ID: %2\n   Gradient Color: %3\n   Style: AI Generated",
      applying: "🎨 | Applying theme...",
      applied: "✅ | Theme applied successfully!",
      error: "❌ | An error occurred:\n%1",
      applyError: "❌ | An error occurred while applying theme:\n%1",
      noThemes: "⚠️ | Unable to create theme with this description, please try another description",
      invalidSelection: "⚠️ | Please enter a number from 1 to %1",
      notAuthor: "⚠️ | Only the person who requested can select the theme",
      missingThemeId: "⚠️ | Please enter theme ID\nExample: {pn} apply 739785333579430",
      applyingById: "🎨 | Applying theme ID: %1...",
      appliedById: "✅ | Successfully applied theme ID: %1!"
    }
  },

  onStart: async function ({ args, message, event, api, getLang, commandName }) {
    const command = args[0];
    
    if (command === "apply" || command === "set") {
      const themeId = args[1];
      
      if (!themeId) {
        return message.reply(getLang("missingThemeId"));
      }

      try {
        message.reply(getLang("applyingById", themeId));
        await api.changeThreadColor(themeId, event.threadID);
        return message.reply(getLang("appliedById", themeId));
      } catch (error) {
        return message.reply(getLang("applyError", error.message || error));
      }
    }

    const prompt = args.join(" ");

    if (!prompt) {
      return message.reply(getLang("missingPrompt"));
    }

    try {
      message.reply(getLang("generating"));

      const themes = await api.createAITheme(prompt);

      if (!themes || themes.length === 0) {
        return message.reply(getLang("noThemes"));
      }

      let themeList = "";
      themes.forEach((theme, index) => {
        const gradientColor = theme.id || "Custom";
        themeList += getLang("themeInfo", index + 1, theme.id, gradientColor) + "\n\n";
      });

      const replyMessage = getLang("preview", themes.length, prompt, themeList.trim());
      
      message.reply(replyMessage, (err, info) => {
        if (err) return;
        
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          themes: themes,
          prompt: prompt
        });
      });

    } catch (error) {
      message.reply(getLang("error", error.message || JSON.stringify(error)));
    }
  },

  onReply: async function ({ message, Reply, event, api, getLang }) {
    const { author, themes, messageID } = Reply;
    
    if (event.senderID !== author) {
      return message.reply(getLang("notAuthor"));
    }

    const selection = parseInt(event.body.trim());
    
    if (isNaN(selection) || selection < 1 || selection > themes.length) {
      return message.reply(getLang("invalidSelection", themes.length));
    }

    const selectedTheme = themes[selection - 1];
    
    try {
      message.reply(getLang("applying"));
      await api.changeThreadColor(selectedTheme.id, event.threadID);
      message.reply(getLang("applied"));
      
      api.unsendMessage(messageID);
    } catch (error) {
      message.reply(getLang("applyError", error.message || error));
    }
  }
};
