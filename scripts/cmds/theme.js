const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "theme",
    aliases: ["aitheme"],
    version: "2.0",
    author: "NeoKEX",
    countDown: 5,
    role: 1,
    description: {
      vi: "Tạo và áp dụng chủ đề AI cho nhóm chat với xem trước hình ảnh",
      en: "Create and apply AI themes for chat group with image previews"
    },
    category: "box chat",
    guide: {
      vi: "   {pn}: Xem chủ đề hiện tại của nhóm"
        + "\n   {pn} <mô tả>: Tạo chủ đề AI và xem xem trước với hình ảnh"
        + "\n   {pn} apply <ID>: Áp dụng chủ đề bằng ID"
        + "\n   Ví dụ: {pn} ocean sunset with purple and pink colors"
        + "\n   Sau đó trả lời tin nhắn với số để chọn chủ đề",
      en: "   {pn}: View current group theme"
        + "\n   {pn} <description>: Create AI theme and preview with images"
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
      appliedById: "✅ | Đã áp dụng chủ đề ID: %1 thành công!",
      currentTheme: "🎨 | Chủ đề hiện tại của nhóm:\n\n📌 Theme ID: %1\n🎨 Màu sắc: %2\n\n💡 Sử dụng {pn} apply <ID> để thay đổi chủ đề",
      fetchingCurrent: "🔍 | Đang lấy thông tin chủ đề hiện tại...",
      noCurrentTheme: "ℹ️ | Nhóm này đang dùng chủ đề mặc định"
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
      appliedById: "✅ | Successfully applied theme ID: %1!",
      currentTheme: "🎨 | Current group theme:\n\n📌 Theme ID: %1\n🎨 Color: %2\n\n💡 Use {pn} apply <ID> to change theme",
      fetchingCurrent: "🔍 | Fetching current theme information...",
      noCurrentTheme: "ℹ️ | This group is using the default theme"
    }
  },

  onStart: async function ({ args, message, event, api, getLang, commandName }) {
    const command = args[0];
    
    if (command === "id") {
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const themeId = threadInfo?.threadTheme?.id || threadInfo?.color || "Unknown";
        return message.reply(`🎨 | Current Theme ID: ${themeId}`);
      } catch (error) {
        return message.reply(getLang("error", error.message || error));
      }
    }
    
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
      try {
        message.reply(getLang("fetchingCurrent"));
        
        const threadInfo = await api.getThreadInfo(event.threadID);
        console.log("Theme Debug - threadInfo keys:", Object.keys(threadInfo));
        console.log("Theme Debug - threadTheme:", JSON.stringify(threadInfo.threadTheme, null, 2));
        
        const theme = threadInfo.threadTheme;
        if (!theme) {
          return message.reply(getLang("noCurrentTheme"));
        }
        
        const themeId = theme.id || theme.theme_fbid || "Unknown";
        let colorInfo = threadInfo.color || "Unknown";
        
        const attachments = [];
        
        if (theme.preview_image_urls) {
          console.log("Theme Debug - preview_image_urls:", theme.preview_image_urls);
          const urls = theme.preview_image_urls;
          if (urls.light_mode) {
            try {
              const lightStream = await getStreamFromURL(urls.light_mode, "theme_light.png");
              if (lightStream) attachments.push(lightStream);
            } catch (imgError) {
              console.log("Failed to load light mode preview:", imgError.message);
            }
          }
          if (urls.dark_mode) {
            try {
              const darkStream = await getStreamFromURL(urls.dark_mode, "theme_dark.png");
              if (darkStream) attachments.push(darkStream);
            } catch (imgError) {
              console.log("Failed to load dark mode preview:", imgError.message);
            }
          }
        }
        
        return message.reply({
          body: getLang("currentTheme", themeId, colorInfo),
          attachment: attachments.length > 0 ? attachments : undefined
        });
      } catch (error) {
        console.log("Theme Error:", error);
        return message.reply(getLang("error", error.message || error));
      }
    }

    try {
      message.reply(getLang("generating"));

      const themes = await api.createAITheme(prompt, 5);

      if (!themes || themes.length === 0) {
        return message.reply(getLang("noThemes"));
      }

      let themeList = "";
      const attachments = [];
      
      for (let index = 0; index < themes.length; index++) {
        const theme = themes[index];
        let colorInfo = "AI Generated";
        
        if (theme.accessibility_label) {
          colorInfo = theme.accessibility_label;
        } else if (theme.gradient_colors && theme.gradient_colors.length > 0) {
          colorInfo = theme.gradient_colors.join(" → ");
        } else if (theme.primary_color) {
          colorInfo = theme.primary_color;
        }
        
        themeList += getLang("themeInfo", index + 1, theme.id, colorInfo) + "\n\n";
        
        if (theme.preview_urls && theme.preview_urls.length > 0) {
          for (let previewIndex = 0; previewIndex < theme.preview_urls.length; previewIndex++) {
            try {
              const previewUrl = theme.preview_urls[previewIndex];
              const mode = previewIndex === 0 ? "light" : "dark";
              const stream = await getStreamFromURL(previewUrl, `theme_${index + 1}_${mode}.png`);
              if (stream) {
                attachments.push(stream);
              }
            } catch (imgError) {
              console.log(`Failed to load preview ${previewIndex} for theme ${index + 1}:`, imgError.message);
            }
          }
        }
      }

      const replyMessage = getLang("preview", themes.length, prompt, themeList.trim());
      
      message.reply({ 
        body: replyMessage,
        attachment: attachments.length > 0 ? attachments : undefined
      }, (err, info) => {
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
