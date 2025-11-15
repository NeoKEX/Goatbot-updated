module.exports = {
  config: {
    name: "theme",
    aliases: ["aitheme"],
    version: "1.0",
    author: "NeoKEX",
    countDown: 5,
    role: 1,
    description: {
      vi: "Tạo chủ đề AI cho nhóm chat",
      en: "Create AI theme for chat group"
    },
    category: "box chat",
    guide: {
      vi: "   {pn} <mô tả chủ đề>: Tạo chủ đề AI dựa trên mô tả"
        + "\n   Ví dụ: {pn} ocean sunset with purple and pink colors",
      en: "   {pn} <theme description>: Create AI theme based on description"
        + "\n   Example: {pn} ocean sunset with purple and pink colors"
    }
  },

  langs: {
    vi: {
      missingPrompt: "⚠️ | Vui lòng nhập mô tả cho chủ đề AI",
      generating: "🎨 | Đang tạo chủ đề AI, vui lòng chờ...",
      success: "✅ | Đã tạo chủ đề AI thành công!\nMô tả: %1\nID chủ đề: %2",
      applying: "🎨 | Đang áp dụng chủ đề...",
      applied: "✅ | Đã áp dụng chủ đề AI thành công!",
      error: "❌ | Đã xảy ra lỗi khi tạo chủ đề AI:\n%1",
      applyError: "❌ | Đã xảy ra lỗi khi áp dụng chủ đề:\n%1",
      noThemes: "⚠️ | Không thể tạo chủ đề với mô tả này, vui lòng thử mô tả khác"
    },
    en: {
      missingPrompt: "⚠️ | Please enter a description for the AI theme",
      generating: "🎨 | Generating AI theme, please wait...",
      success: "✅ | AI theme created successfully!\nDescription: %1\nTheme ID: %2",
      applying: "🎨 | Applying theme...",
      applied: "✅ | AI theme applied successfully!",
      error: "❌ | An error occurred while creating AI theme:\n%1",
      applyError: "❌ | An error occurred while applying theme:\n%1",
      noThemes: "⚠️ | Unable to create theme with this description, please try another description"
    }
  },

  onStart: async function ({ args, message, event, api, getLang }) {
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

      const theme = themes[0];
      const themeId = theme.id;

      message.reply(getLang("success", prompt, themeId));

      try {
        message.reply(getLang("applying"));
        await api.changeThreadColor(themeId, event.threadID);
        message.reply(getLang("applied"));
      } catch (applyError) {
        message.reply(getLang("applyError", applyError.message || applyError));
      }

    } catch (error) {
      message.reply(getLang("error", error.message || error));
    }
  }
};
