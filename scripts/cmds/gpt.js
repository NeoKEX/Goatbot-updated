const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://gpt-img-2.onrender.com";
const MAX_ATTACHMENT_BYTES = 26214400;
const ALLOWED_RATIOS = new Set(["1:1", "3:4", "4:3", "16:9", "9:16"]);

const FLAG_REGEX = /--(ar|ratio|count|n|style|lighting|camera|negative)\s+([^-]+?)(?=(?:\s--)|$)/gi;

function parseFlags(rawPrompt) {
  const flags = {};
  let match;
  FLAG_REGEX.lastIndex = 0;
  while ((match = FLAG_REGEX.exec(rawPrompt)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (!value) continue;
    if (key === "ar" || key === "ratio") flags.ratio = value;
    else if (key === "count" || key === "n") flags.count = value;
    else flags[key] = value;
  }
  const prompt = rawPrompt.replace(FLAG_REGEX, "").replace(/\s{2,}/g, " ").trim();
  return { prompt, flags };
}

// The server allows 1-4 source images for img2img. Reply to a single image
// (the common case) or to a message with multiple photo attachments.
function extractImageUrlsFromEvent(event, max = 4) {
  const urls = [];
  const sources = [event.messageReply?.attachments, event.attachments];

  for (const attachments of sources) {
    if (!Array.isArray(attachments)) continue;
    for (const a of attachments) {
      if (a.type !== "photo" && a.type !== "sticker") continue;
      const url = a.url || a.largePreviewUrl || a.previewUrl;
      if (url && !urls.includes(url)) urls.push(url);
      if (urls.length >= max) return urls;
    }
    if (urls.length > 0) return urls; // prefer the reply's images over the current message's
  }

  return urls;
}

function formatError(res, label = "GPT") {
  console.error(`[${label} HTTP ${res.status}]:`, JSON.stringify(res.data)?.slice(0, 2000));

  const err = res.data?.error;
  if (err === "prompt is required") return "A prompt is required.";
  if (err === "rate_limited") return "The image provider is rate-limiting requests right now — try again shortly.";
  if (err === "api_key_invalid") return "The provider rejected the API key or the request failed downstream.";
  if (res.status === 503) return err || "No provider account is available right now — try again shortly.";
  if (typeof err === "string") return err;
  return `Request failed (status ${res.status}).`;
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
    name: "gpt",
    aliases: ["gptimg", "gptimage"],
    version: "1.1",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate or edit images via gptimage2.ai (gpt-image-2 model)" },
    longDescription: { en: "Generate images from a prompt, or reply to an image (up to 4) with a prompt to edit them, using the gpt-image-2 model. Use 'status' or 'models' for provider info." },
    category: "ai",
    guide: {
      en: "{pn} <prompt> [--ar 1:1|3:4|4:3|16:9|9:16] [--count N] [--style ...] [--lighting ...] [--camera ...] [--negative ...]\n(reply to 1-4 images) {pn} <edit prompt>\n{pn} status\n{pn} models"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "status") {
      try {
        const res = await axios.get(`${BASE_URL}/api/status`, { timeout: 20000, validateStatus: () => true });
        if (res.status >= 400) return message.reply(`Status check failed (status ${res.status}).`);

        const { success, provider, ...stats } = res.data || {};
        const lines = [`Provider: ${provider || "gptimage2.ai"}`];
        for (const [key, value] of Object.entries(stats)) {
          lines.push(`${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
        }
        return message.reply(lines.join("\n"));
      } catch (e) {
        console.error("[GPT STATUS ERROR]:", e?.response?.data || e.message || e);
        return message.reply("Couldn't fetch provider status.");
      }
    }

    if (sub === "models") {
      try {
        const res = await axios.get(`${BASE_URL}/api/models`, { timeout: 20000, validateStatus: () => true });
        if (res.status >= 400) return message.reply(`Models lookup failed (status ${res.status}).`);

        const models = Array.isArray(res.data?.models) ? res.data.models : [];
        if (models.length === 0) return message.reply("No models were returned.");

        const lines = [`Default: ${res.data.default || "gpt-image-2"}`, "", "Available models:"];
        for (const m of models) {
          lines.push(`- ${m.id}${m.name ? ` (${m.name})` : ""}`);
        }
        return message.reply(lines.join("\n"));
      } catch (e) {
        console.error("[GPT MODELS ERROR]:", e?.response?.data || e.message || e);
        return message.reply("Couldn't fetch the model list.");
      }
    }

    const rawPrompt = args.join(" ");
    if (!rawPrompt) {
      return message.reply("Usage: {pn} <prompt> [--ar 1:1|3:4|4:3|16:9|9:16] [--count N] [--style ...] [--lighting ...] [--camera ...] [--negative ...]\n(reply to 1-4 images) {pn} <edit prompt>\n{pn} status\n{pn} models");
    }

    const { prompt, flags } = parseFlags(rawPrompt);
    if (!prompt) {
      return message.reply("Usage: {pn} <prompt> [--ar 1:1|3:4|4:3|16:9|9:16] [--count N] [--style ...] [--lighting ...] [--camera ...] [--negative ...]");
    }

    const imageUrls = extractImageUrlsFromEvent(event);
    const endpoint = imageUrls.length > 0 ? "/api/img2img" : "/api/generate";

    const body = { prompt };
    if (imageUrls.length > 0) body.imageUrls = imageUrls;
    if (flags.ratio) {
      if (!ALLOWED_RATIOS.has(flags.ratio)) {
        return message.reply(`Invalid --ar value "${flags.ratio}". Allowed: ${[...ALLOWED_RATIOS].join(", ")}`);
      }
      body.ratio = flags.ratio;
    }
    if (flags.count) {
      const n = parseInt(flags.count, 10);
      if (!Number.isNaN(n) && n > 0) body.count = n;
    }
    if (flags.style) body.style = flags.style;
    if (flags.lighting) body.lighting = flags.lighting;
    if (flags.camera) body.camera = flags.camera;
    if (flags.negative) body.negative = flags.negative;

    api.setMessageReaction("⏳", event.messageID);

    try {
      const res = await axios.post(`${BASE_URL}${endpoint}`, body, {
        timeout: 120000,
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true
      });

      if (res.status >= 400 || res.data?.success === false) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(formatError(res));
      }

      const images = Array.isArray(res.data?.images) ? res.data.images : [];
      if (images.length === 0) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("No images were found in the API's response.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const attachments = [];

      for (let i = 0; i < images.length; i++) {
        if (!images[i]?.url) continue;
        const buffer = await downloadToBuffer(images[i].url);
        const filePath = path.join(cacheDir, `gpt_${Date.now()}_${i}.jpg`);
        await fs.writeFile(filePath, buffer);
        attachments.push(fs.createReadStream(filePath));
      }

      if (attachments.length === 0) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("The response included images but none had a usable URL.");
      }

      await message.reply({
        body: `Here's your ${imageUrls.length > 0 ? "edited" : "generated"} image${attachments.length > 1 ? "s" : ""}.`,
        attachment: attachments
      });

      api.setMessageReaction("✅", event.messageID);
      attachments.forEach((s) => setTimeout(() => fs.remove(s.path).catch(() => {}), 10000));
    } catch (e) {
      console.error("[GPT COMMAND ERROR]:", e?.response?.data || e.message || e);
      api.setMessageReaction("❌", event.messageID);
      message.reply("An error occurred while generating the image.");
    }
  }
};
