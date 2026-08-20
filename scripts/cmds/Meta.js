const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = process.env.META_API_BASE_URL || "https://meta.nkx.lol";
const API_KEY = process.env.META_API_KEY || "dhonkhara";
const AUTH_HEADERS = { "X-API-Key": API_KEY, "Authorization": `Bearer ${API_KEY}` };
const MAX_ATTACHMENT_BYTES = 26214400;

const ALLOWED_ASPECT_RATIOS = new Set(["1:1", "9:16", "16:9"]);

function extractAspectRatioFlag(prompt) {
  const match = prompt.match(/--ar\s+(\d+:\d+)/i);
  if (!match || !ALLOWED_ASPECT_RATIOS.has(match[1])) {
    return { prompt, aspectRatio: null };
  }
  return { prompt: prompt.replace(match[0], "").trim(), aspectRatio: match[1] };
}

function formatError(res, label = "META") {
  console.error(`[${label} HTTP ${res.status}]:`, JSON.stringify(res.data)?.slice(0, 2000));

  if (res.status === 422 && Array.isArray(res.data?.detail)) {
    return res.data.detail.map((d) => d.msg || d).join("; ");
  }
  if (res.status === 401) return "The API server rejected its own API key. Check the server's API_KEY config.";
  if (res.status === 500) return "The API server hit an internal error. Check its logs — this is a server-side bug, not a client request problem.";
  if (res.status === 404) return "That project/image could not be found.";
  if (res.status === 502) return "The Vibes provider failed to fulfill this request. Try again.";
  if (res.status === 503) return "The API server's Vibes session is misconfigured (vibes.txt missing or invalid).";
  return res.data?.message || res.data?.error || `Request failed (status ${res.status}).`;
}

function extractGeneratedImageUrls(data) {
  const items = data?.data;
  if (Array.isArray(items)) {
    const urls = items.map((it) => it.url).filter((u) => typeof u === "string" && u.startsWith("http"));
    if (urls.length) return urls;
  }
  return [];
}

function extractEditedImageUrl(data) {
  const contentItem = data?.contentItem || data?.result?.contentItem;
  return data?.imageUrl || data?.data?.imageUrl || contentItem?.imageUrl || contentItem?.structuredOutput?.image || null;
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

async function uploadImageUrl(fileUrl) {
  const buffer = await downloadToBuffer(fileUrl);
  const res = await axios.post(`${BASE_URL}/api/v1/upload/image`, {
    image_base64: buffer.toString("base64")
  }, {
    timeout: 120000,
    headers: { ...AUTH_HEADERS, "Content-Type": "application/json" },
    validateStatus: () => true
  });
  if (res.status >= 400 || !res.data?.mediaEntId) {
    throw new Error(`Image upload failed (${res.status})`);
  }
  return res.data.mediaEntId;
}

module.exports = {
  config: {
    name: "meta",
    aliases: ["img", "imagine"],
    version: "1.3",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "AI image generation and editing" },
    longDescription: { en: "Generate an image from a prompt, or reply to an image with a prompt to edit it." },
    category: "ai",
    guide: { en: "{pn} <prompt>\n(reply to an image) {pn} <edit prompt>" }
  },

  onStart: async function ({ message, args, event, api }) {
    const rawPrompt = args.join(" ");
    if (!rawPrompt) return message.reply("Usage: {pn} <prompt> [--ar 1:1|9:16|16:9] (reply to an image to edit it)");

    const { prompt, aspectRatio } = extractAspectRatioFlag(rawPrompt);
    if (!prompt) return message.reply("Usage: {pn} <prompt> [--ar 1:1|9:16|16:9] (reply to an image to edit it)");

    const imageUrl = extractImageUrlFromEvent(event);
    const endpoint = imageUrl ? "/api/v1/images/edit" : "/api/v1/images/generate";
    api.setMessageReaction("⏳", event.messageID);

    try {
      const body = imageUrl
        ? { source_image_ent_id: await uploadImageUrl(imageUrl), edit_prompt: prompt }
        : { prompt, aspect_ratio: aspectRatio || "1:1", resolution: "480p", variations: 1 };
      const res = await axios.post(`${BASE_URL}${endpoint}`, body, {
        timeout: 120000,
        headers: AUTH_HEADERS,
        validateStatus: () => true
      });

      if (res.status >= 400) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(formatError(res));
      }

      const urls = imageUrl
        ? [extractEditedImageUrl(res.data)].filter(Boolean)
        : extractGeneratedImageUrls(res.data);

      if (urls.length === 0) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("No image URL was found in the API's response.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const attachments = [];

      for (let i = 0; i < urls.length; i++) {
        const buffer = await downloadToBuffer(urls[i]);
        const filePath = path.join(cacheDir, `meta_${Date.now()}_${i}.jpg`);
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
