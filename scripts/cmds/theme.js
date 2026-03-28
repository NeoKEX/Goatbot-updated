const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "theme",
    aliases: ["aitheme", "changetheme"],
    version: "2.1",
    author: "Neoaz ゐ",
    countDown: 5,
    role: 1,
    description: "Create and apply AI themes for chat group with image previews",
    category: "box chat",
    guide: "{pn}: View current theme\n{pn} list: List available themes\n{pn} <description>: Create AI theme\n{pn} apply <ID>: Apply theme by ID"
  },

  langs: {
    en: {
      missingPrompt: "Enter a description or theme ID\nExamples:\n• ocean sunset\n• apply 739785333579430",
      generating: "Generating...",
      preview: "Generated %1 theme(s)! %2\n\n%3\nReply with number 1-%1",
      themeInfo: "%1. ID: %2\nColor: %3",
      applying: "Applying...",
      applied: "Applied!",
      error: "Error: %1",
      applyError: "Apply error: %1",
      noThemes: "No themes found",
      invalidSelection: "Choose 1-%1",
      notAuthor: "Only requester can select",
      missingThemeId: "Enter theme ID\nExample: apply 739785333579430",
      applyingById: "Applying %1...",
      appliedById: "Applied %1!",
      currentTheme: "Current: ID %1, Color %2\nUse apply <ID> to change",
      fetchingCurrent: "Fetching...",
      noCurrentTheme: "Using default theme",
      showingPreviews: "Previews:",
      previousTheme: "Previous: ID %1, Color %2",
      listingThemes: "Available themes:\n\n%1",
      themeListItem: "%1. ID: %2\nName: %3\nColor: %4\n"
    }
  },

  onStart: async function ({ args, message, event, api, getLang, commandName }) {
    const command = args[0];

    if (command === "id") {
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const themeId = threadInfo?.threadTheme?.id || threadInfo?.color || "Unknown";
        return message.reply(`Current Theme ID: ${themeId}`);
      } catch (error) {
        return message.reply(getLang("error", error.message || error));
      }
    }

    if (command === "apply" || command === "set") {
      const themeId = args[1];
      if (!themeId) return message.reply(getLang("missingThemeId"));
      try {
        message.reply(getLang("applyingById", themeId));
        await api.changeThreadColor(themeId, event.threadID);
        return message.reply(getLang("appliedById", themeId));
      } catch (error) {
        return message.reply(getLang("applyError", error.message || error));
      }
    }

    if (command === "list") {
      try {
        message.reply(getLang("fetchingCurrent"));
        const themes = await api.getTheme(event.threadID);
        if (!themes || themes.length === 0) return message.reply("No themes available.");

        let themeList = "";
        let counter = 1;

        for (const t of themes) {
          try {
            const themeInfo = await api.getThemeInfo(t.id);
            const name = themeInfo?.accessibility_label || themeInfo?.name || "Unknown";
            const color = themeInfo?.primary_color || "Unknown";
            themeList += getLang("themeListItem", counter++, t.id, name, color);

            if (themeInfo?.alternative_themes?.length > 0) {
              for (const alt of themeInfo.alternative_themes) {
                themeList += getLang("themeListItem", counter++, alt.id, alt.accessibility_label || "Variant", alt.primary_color || "Unknown");
              }
            }
          } catch (err) {
            themeList += `${counter++}. ID: ${t.id}\nName: Unknown\nColor: Unknown\n`;
          }
        }
        return message.reply(getLang("listingThemes", themeList.trim()));
      } catch (error) {
        return message.reply(getLang("error", error.message || error));
      }
    }

    const prompt = args.join(" ");
    if (!prompt) {
      try {
        message.reply(getLang("fetchingCurrent"));
        const threadInfo = await api.getThreadInfo(event.threadID);
        const theme = threadInfo.threadTheme;
        if (!theme) return message.reply(getLang("noCurrentTheme"));

        const themeId = theme.id || theme.theme_fbid || "Unknown";
        let colorInfo = threadInfo.color || theme.accessibility_label || "Unknown";
        const attachments = [];

        const extractUrl = (obj) => obj?.uri || obj?.url || (typeof obj === 'string' ? obj : null);

        try {
          const currentThemeData = await api.getThemeInfo(themeId);
          if (currentThemeData) {
            if (currentThemeData.name) colorInfo = currentThemeData.name;
            const bgUrl = extractUrl(currentThemeData.backgroundImage);
            if (bgUrl) {
              const stream = await getStreamFromURL(bgUrl, "current_theme.png");
              if (stream) attachments.push(stream);
            }
          }
        } catch (err) {}

        const body = attachments.length > 0 ? `${getLang("currentTheme", themeId, colorInfo)}\n\n${getLang("showingPreviews")}` : getLang("currentTheme", themeId, colorInfo);
        return message.reply({ body, attachment: attachments.length > 0 ? attachments : undefined });
      } catch (error) {
        return message.reply(getLang("error", error.message || error));
      }
    }

    try {
      message.reply(getLang("generating"));
      const themes = await api.createAITheme(prompt, 5);
      if (!themes || themes.length === 0) return message.reply(getLang("noThemes"));

      let themeList = "";
      const attachments = [];
      const extractUrl = (obj) => obj?.uri || obj?.url || (typeof obj === 'string' ? obj : null);

      for (let i = 0; i < themes.length; i++) {
        const theme = themes[i];
        const colorInfo = theme.accessibility_label || theme.gradient_colors?.join(" → ") || theme.primary_color || "AI Generated";
        themeList += getLang("themeInfo", i + 1, theme.id, colorInfo) + "\n\n";

        let imageUrls = [];
        if (theme.preview_image_urls) {
          const light = extractUrl(theme.preview_image_urls.light_mode);
          const dark = extractUrl(theme.preview_image_urls.dark_mode);
          if (light) imageUrls.push({ url: light, name: `theme_${i + 1}_l.png` });
          if (dark && dark !== light) imageUrls.push({ url: dark, name: `theme_${i + 1}_d.png` });
        }

        if (imageUrls.length === 0) {
          const bg = extractUrl(theme.background_asset?.image);
          if (bg) imageUrls.push({ url: bg, name: `theme_${i + 1}_bg.png` });
        }

        for (const img of imageUrls) {
          try {
            const stream = await getStreamFromURL(img.url, img.name);
            if (stream) attachments.push(stream);
          } catch (err) {}
        }
      }

      const replyBody = getLang("preview", themes.length, prompt, themeList.trim());
      message.reply({ body: replyBody, attachment: attachments.length > 0 ? attachments : undefined }, (err, info) => {
        if (err) {
          message.reply(replyBody, (rErr, rInfo) => {
            if (rErr) return;
            global.GoatBot.onReply.set(rInfo.messageID, { commandName, author: event.senderID, themes });
          });
        } else {
          global.GoatBot.onReply.set(info.messageID, { commandName, author: event.senderID, themes });
        }
      });
    } catch (error) {
      message.reply(getLang("error", error.message || JSON.stringify(error)));
    }
  },

  onReply: async function ({ message, Reply, event, api, getLang }) {
    const { author, themes, messageID } = Reply;
    if (event.senderID !== author) return message.reply(getLang("notAuthor"));

    const selection = parseInt(event.body.trim());
    if (isNaN(selection) || selection < 1 || selection > themes.length) {
      return message.reply(getLang("invalidSelection", themes.length));
    }

    const selectedTheme = themes[selection - 1];
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const current = threadInfo.threadTheme;
      const cId = current?.id || current?.theme_fbid || "Default";
      const cCol = threadInfo.color || current?.accessibility_label || "Default";

      message.reply(getLang("applying"));
      await api.changeThreadColor(selectedTheme.id, event.threadID);
      message.reply(`${getLang("applied")}\n\n${getLang("previousTheme", cId, cCol)}`);
      api.unsendMessage(messageID);
    } catch (error) {
      message.reply(getLang("applyError", error.message || error));
    }
  }
};
