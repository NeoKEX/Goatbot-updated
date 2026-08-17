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
  if (res.status === 404) return "That video batch could not be found.";
  if (res.status === 502) return "The Vibes provider failed to fulfill this request. Try again (a fresh submission, not a retry).";
  if (res.status === 503) return "The API server's Vibes session is misconfigured (vibes.txt missing or invalid).";
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// POST /v1/videos/generate and /v1/videos/from-image return immediately
// with result.batchId and isLoading:true items — the actual videoUrl only
// shows up once GET /v1/videos/{batch_id} reports result.isComplete: true
// and result.content[0].videoUrl is populated.
async function pollForVideo(batchId, { intervalMs = 3000, timeoutMs = 180000 } = {}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await sleep(intervalMs);

    const res = await axios.get(`${BASE_URL}/v1/videos/${encodeURIComponent(batchId)}`, {
      timeout: 30000,
      validateStatus: () => true
    });
    if (res.status >= 400) continue;

    const result = res.data?.result;
    if (!result) continue;

    const item = Array.isArray(result.content) ? result.content[0] : null;

    if (item?.videoUrl) {
      return { videoUrl: item.videoUrl };
    }
    if (result.hasError || item?.error) {
      return { error: result.error || item?.error || "Video generation failed." };
    }
  }

  return { error: "Timed out waiting for the video to finish generating." };
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
    version: "1.2",
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
      poll: false,
      poll_interval: 3,
      poll_timeout: 180
    };
    const body = imageUrl
      ? { ...baseBody, image_url: imageUrl, prompt: prompt || "Animate this image naturally." }
      : { ...baseBody, prompt };

    api.setMessageReaction("⏳", event.messageID);

    try {
      const res = await axios.post(`${BASE_URL}${endpoint}`, body, {
        timeout: 60000,
        validateStatus: () => true
      });

      if (res.status >= 400) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(formatError(res));
      }

      const batchId = res.data?.result?.batchId;
      if (!batchId) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply("The API didn't return a batch ID to track this generation.");
      }

      const { videoUrl, error } = await pollForVideo(batchId, { intervalMs: 3000, timeoutMs: 180000 });

      if (!videoUrl) {
        api.setMessageReaction("❌", event.messageID);
        return message.reply(error || "Video generation didn't finish in time.");
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
