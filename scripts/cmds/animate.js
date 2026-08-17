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
    (k, v) => /^https?:\/\//i.test(v) && /url|video|media|asset|output|link/i.test(k)
  );
  if (hinted.length) return [...new Set(hinted)];

  const anyUrl = deepCollect(data, (k, v) => /^https?:\/\//i.test(v));
  return [...new Set(anyUrl)];
}

function extractBatchId(data) {
  const found = deepCollect(data, (k) => /batch_?id/i.test(k));
  return found.length ? found[0] : null;
}

function extractStatus(data) {
  const found = deepCollect(data, (k) => /^status$/i.test(k));
  return found.length ? found[0].toLowerCase() : null;
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

async function pollForVideoUrl(batchId, { attempts = 40, intervalMs = 3000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await axios.get(`${BASE_URL}/v1/videos/${encodeURIComponent(batchId)}`, {
      timeout: 30000,
      validateStatus: () => true
    });
    if (res.status >= 400) continue;

    const urls = extractMediaUrls(res.data);
    if (urls.length) return urls[0];

    const status = extractStatus(res.data);
    if (status && /fail|error/i.test(status)) return null;
  }
  return null;
}

async function downloadToBuffer(fileUrl) {
  const res = await axios.get(fileUrl, {
    responseType: "arraybuffer",
    timeout: 120000,
    maxContentLength: MAX_ATTACHMENT_BYTES,
    maxBodyLength: MAX_ATTACHMENT_BYTES,
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  return Buffer.from(res.data);
}

module.exports = {
  config: {
    name: "animate",
    aliases: ["vid", "video"],
    version: "1.0",
    author: "Neoaz 🐊",
    countDown: 10,
    role: 0,
    shortDescription: { en: "AI video generation" },
    longDescription: { en: "Generate a video from a prompt, or reply to an image with a prompt to animate it." },
    category: "ai",
    guide: { en: "{pn} <prompt>\n(reply to an image) {pn} [prompt]" }
  },

  onStart: async function ({ message, args, event, api }) {
    const prompt = args.join(" ");
    const imageUrl = extractImageUrlFromEvent(event);

    if (!imageUrl && !prompt) {
      return message.reply("Usage: {pn} <prompt> (or reply to an image, prompt optional)");
    }

    const endpoint = imageUrl ? "/v1/videos/from-image" : "/v1/videos/generate";
    const baseBody = {
      project_name: imageUrl ? "Goatbot image-to-video generation" : "Goatbot video generation",
      aspect_ratio: "9:16",
      resolution: "480p",
      variations: 1,
      poll: true,
      poll_interval: 3,
      poll_timeout: 180
    };
    const body = imageUrl
      ? { ...baseBody, source_image_url: imageUrl, prompt: prompt || "Animate this image naturally." }
      : { ...baseBody, prompt };

    api.setMessageReaction("⏳", event.messageID);

    try {
      const res = await axios.post(`${BASE_URL}${endpoint}`, body, {
        timeout: 200000,
        validateStatus: () => true
      });

      if (res.status >= 400) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(formatError(res));
      }

      let videoUrl = extractMediaUrls(res.data)[0] || null;

      if (!videoUrl) {
        const batchId = extractBatchId(res.data);
        if (batchId) videoUrl = await pollForVideoUrl(batchId);
      }

      if (!videoUrl) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("Video generation didn't return a downloadable link in time.");
      }

      const buffer = await downloadToBuffer(videoUrl);
      if (buffer.byteLength > MAX_ATTACHMENT_BYTES) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("The generated video exceeds Messenger's 25MB limit.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `animate_${Date.now()}.mp4`);
      await fs.writeFile(filePath, buffer);

      await message.reply({
        body: imageUrl ? "Here's your animated video." : "Here's your generated video.",
        attachment: fs.createReadStream(filePath)
      });

      api.setMessageReaction("✅", event.messageID);
      fs.remove(filePath).catch(() => {});
    } catch (e) {
      console.error("[ANIMATE COMMAND ERROR]:", e?.response?.data || e.message || e);
      api.setMessageReaction("❌", event.messageID);
      message.reply("An error occurred while generating the video.");
    }
  }
};
