const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://meta.nkx.lol";
const MAX_ATTACHMENT_BYTES = 26214400;

function deepCollect(obj, predicate, results = [], depth = 0) {
  if (depth > 6 || obj == null) return results;
  if (Array.isArray(obj)) {
    obj.forEach((v) => deepCollect(v, predicate, results, depth + 1));
    return results;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string" && predicate(k, v)) results.push(v);
      else deepCollect(v, predicate, results, depth + 1);
    }
  }
  return results;
}

function extractMediaUrls(data) {
  const hinted = deepCollect(
    data,
    (k, v) => /^https?:\/\//i.test(v) && /url|image|video|media|asset|output|link/i.test(k)
  );
  if (hinted.length) return [...new Set(hinted)];

  const anyUrl = deepCollect(data, (k, v) => /^https?:\/\//i.test(v));
  return [...new Set(anyUrl)];
}

function formatError(res) {
  if (res.status === 422 && Array.isArray(res.data?.detail)) {
    return res.data.detail.map((d) => d.msg).join("; ");
  }
  return res.data?.message || res.data?.error || `Request failed (status ${res.status}).`;
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
    name: "meta",
    aliases: ["img", "imagine"],
    version: "1.0",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "AI image generation and editing" },
    longDescription: { en: "Generate an image from a prompt, or reply to an image with a prompt to edit it." },
    category: "ai",
    guide: { en: "{pn} <prompt>\n(reply to an image) {pn} <edit prompt>" }
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Usage: {pn} <prompt> (reply to an image to edit it)");

    const imageUrl = extractImageUrlFromEvent(event);
    const endpoint = imageUrl ? "/v1/images/edit" : "/v1/images/generate";
    const body = imageUrl
      ? { source_image_url: imageUrl, prompt, project_name: "Goatbot image edit" }
      : { prompt, project_name: "Goatbot image generation", aspect_ratio: "1:1", resolution: "480p", variations: 1 };

    api.setMessageReaction("⏳", event.messageID);

    try {
      const res = await axios.post(`${BASE_URL}${endpoint}`, body, {
        timeout: 120000,
        validateStatus: () => true
      });

      if (res.status >= 400) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(formatError(res));
      }

      const urls = extractMediaUrls(res.data).slice(0, 4);
      if (urls.length === 0) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("No image URL could be found in the API's response.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const attachments = [];

      for (let i = 0; i < urls.length; i++) {
        const buffer = await downloadToBuffer(urls[i]);
        const filePath = path.join(cacheDir, `meta_${Date.now()}_${i}.png`);
        await fs.writeFile(filePath, buffer);
        attachments.push(fs.createReadStream(filePath));
      }

      await message.reply({
        body: imageUrl ? "Here's your edited image." : "Here's your generated image.",
        attachment: attachments
      });

      api.setMessageReaction("✅", event.messageID);
      attachments.forEach((s) => setTimeout(() => fs.remove(s.path).catch(() => {}), 10000));
    } catch (e) {
      console.error("[META COMMAND ERROR]:", e?.response?.data || e.message || e);
      api.setMessageReaction("❌", event.messageID);
      message.reply("An error occurred while generating the image.");
    }
  }
};
