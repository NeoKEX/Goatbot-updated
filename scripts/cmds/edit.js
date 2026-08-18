const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://meta.nkx.lol";
const MAX_ATTACHMENT_BYTES = 26214400;

function formatError(res) {
  if (res.status === 422 && Array.isArray(res.data?.detail)) {
    return res.data.detail.map((d) => d.msg || d).join("; ");
  }
  if (res.status === 401) return "The API server rejected its own API key. Check the server's API_KEY config.";
  if (res.status === 404) return "That project/image could not be found.";
  if (res.status === 502) return "The Vibes provider failed to fulfill this request. Try again.";
  if (res.status === 503) return "The API server's Vibes session is misconfigured (vibes.txt missing or invalid).";
  return res.data?.message || res.data?.error || `Request failed (status ${res.status}).`;
}

function extractEditedImageUrl(data) {
  const contentItem = data?.result?.contentItem;
  return contentItem?.imageUrl || contentItem?.structuredOutput?.image || null;
}

function extractImageUrlFromEvent(event) {
  const sources = [event.messageReply?.attachments, event.attachments];
  for (const attachments of sources) {
    if (!Array.isArray(attachments)) continue;
    const photo = attachments.find((a) => a.type === "photo" || a.type === "sticker");
    if (photo) {
      const url = photo.url || photo.largePreviewUrl || photo.previewUrl;
      if (url) return url;
    }
  }
  return null;
}

async function downloadToBuffer(fileUrl) {
  const res = await axios.get(fileUrl, {
    responseType: "arraybuffer",
    timeout: 60000,
    maxContentLength: MAX_ATTACHMENT_BYTES,
    maxBodyLength: MAX_ATTACHMENT_BYTES,
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  return Buffer.from(res.data);
}

module.exports = {
  config: {
    name: "edit",
    aliases: ["editimg", "imgedit"],
    version: "1.0",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "AI image-to-image editing" },
    longDescription: { en: "Reply to an image with an edit instruction to transform it." },
    category: "ai",
    guide: { en: "(reply to an image) {pn} <edit prompt>" }
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ");
    const imageUrl = extractImageUrlFromEvent(event);

    if (!imageUrl) return message.reply("Reply to an image with this command to edit it.");
    if (!prompt) return message.reply("Usage: (reply to an image) {pn} <edit prompt>");

    api.setMessageReaction("⏳", event.messageID);

    try {
      const res = await axios.post(`${BASE_URL}/v1/images/edit`, {
        image_url: imageUrl,
        prompt,
        project_name: "Goatbot image edit"
      }, {
        timeout: 120000,
        validateStatus: () => true
      });

      if (res.status >= 400) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(formatError(res));
      }

      const editedUrl = extractEditedImageUrl(res.data);
      if (!editedUrl) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("No image URL was found in the API's response.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `edit_${Date.now()}.jpg`);
      const buffer = await downloadToBuffer(editedUrl);
      await fs.writeFile(filePath, buffer);

      await message.reply({
        body: "Here's your edited image.",
        attachment: fs.createReadStream(filePath)
      });

      api.setMessageReaction("✅", event.messageID);
      fs.remove(filePath).catch(() => {});
    } catch (e) {
      console.error("[EDIT COMMAND ERROR]:", e?.response?.data || e.message || e);
      api.setMessageReaction("❌", event.messageID);
      message.reply("An error occurred while editing the image.");
    }
  }
};
