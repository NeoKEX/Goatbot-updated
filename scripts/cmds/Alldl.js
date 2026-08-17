const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://downloader.nkx.lol";
const TOGGLE_FILE = path.join(__dirname, "data", "alldlThreads.json");
const MAX_ATTACHMENT_BYTES = 26214400; // Messenger's ~25MB attachment limit

let enabledThreads = new Set();

function loadToggleState() {
  try {
    fs.ensureFileSync(TOGGLE_FILE);
    const raw = fs.readFileSync(TOGGLE_FILE, "utf8").trim();
    const arr = raw ? JSON.parse(raw) : [];
    enabledThreads = new Set(arr);
  } catch (e) {
    enabledThreads = new Set();
  }
}

function saveToggleState() {
  fs.ensureDirSync(path.dirname(TOGGLE_FILE));
  fs.writeFileSync(TOGGLE_FILE, JSON.stringify([...enabledThreads]), "utf8");
}

loadToggleState();

const PLATFORMS = [
  { name: "tiktok", regex: /(?:tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i, endpoint: "tiktok" },
  { name: "instagram", regex: /instagram\.com/i, endpoint: "instagram" },
  { name: "facebook", regex: /(?:facebook\.com|fb\.watch)/i, endpoint: "facebook" },
  { name: "pinterest", regex: /(?:pinterest\.com|pin\.it)/i, endpoint: "pinterest" },
  { name: "twitter", regex: /(?:twitter\.com|x\.com)/i, endpoint: "twitter" },
  { name: "youtube", regex: /(?:youtube\.com|youtu\.be)/i, endpoint: "youtube" },
];

function detectPlatform(url) {
  return PLATFORMS.find((p) => p.regex.test(url)) || null;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/i;

function extractUrlFromText(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(URL_REGEX);
  return match ? match[1] : null;
}

function extractUrlFromAttachments(attachments) {
  if (!Array.isArray(attachments)) return null;
  for (const att of attachments) {
    // Only "share" attachments (a shared video/post/link) carry a URL we
    // want to act on. Stickers, photos, audio clips, files, etc. also
    // expose url-like fields pointing to their own CDN asset — acting on
    // those caused the bot to respond to stickers, so they're excluded.
    if (att?.type !== "share") continue;
    const candidate = att?.url || att?.uri || att?.source || att?.target?.url;
    if (candidate && /^https?:\/\//i.test(candidate)) return candidate;
  }
  return null;
}

function hasAudioFlag(text) {
  return typeof text === "string" && /--a\s*$/i.test(text.trim());
}

function stripAudioFlag(text) {
  return typeof text === "string" ? text.replace(/--a\s*$/i, "").trim() : text;
}

/**
 * Resolves a target URL + whether audio was requested, from either:
 *  - the message itself (a pasted link, optionally ending in --a)
 *  - a native "share" attachment (video shared directly instead of a link)
 *  - a reply to an earlier message/share that contained a link, where the
 *    reply body is just "--a" to request the audio version of it
 */
function resolveRequest(event) {
  const replyBody = event.messageReply?.body;
  const replyAttachments = event.messageReply?.attachments;
  const bodyIsJustAudioFlag = event.messageReply && /^--a$/i.test((event.body || "").trim());

  if (bodyIsJustAudioFlag) {
    const url =
      extractUrlFromText(replyBody) || extractUrlFromAttachments(replyAttachments);
    if (url) return { url, wantsAudio: true };
  }

  const bodyUrl = extractUrlFromText(stripAudioFlag(event.body));
  if (bodyUrl) return { url: bodyUrl, wantsAudio: hasAudioFlag(event.body) };

  const attachmentUrl = extractUrlFromAttachments(event.attachments);
  if (attachmentUrl) return { url: attachmentUrl, wantsAudio: hasAudioFlag(event.body) };

  return null;
}

async function fetchMedia(endpoint, url) {
  const res = await axios.get(`${BASE_URL}/api/download/${endpoint}`, {
    params: { url },
    timeout: 30000,
    validateStatus: () => true,
  });

  if (!res.data?.success) {
    return { ok: false, message: res.data?.message || "Download failed." };
  }

  return { ok: true, data: res.data.data };
}

/**
 * Normalizes each platform's differently-shaped payload into
 * { videoUrl, audioUrl, imageUrl, title }.
 */
function extractMediaLinks(platformName, data) {
  switch (platformName) {
    case "tiktok":
      return {
        videoUrl: Array.isArray(data.video) ? data.video[0] : null,
        audioUrl: Array.isArray(data.audio) ? data.audio[0] : null,
        imageUrl: null,
        title: data.title || "TikTok",
      };
    case "instagram": {
      const first = Array.isArray(data.result) ? data.result[0] : null;
      return {
        videoUrl: first?.url || null,
        audioUrl: null,
        imageUrl: null,
        title: "Instagram",
      };
    }
    case "facebook":
      return {
        videoUrl: data.HD || data.Normal_video || null,
        audioUrl: null,
        imageUrl: null,
        title: "Facebook",
      };
    case "pinterest": {
      const nested = data.result?.result || {};
      return {
        videoUrl: nested.video_url || null,
        audioUrl: null,
        imageUrl: nested.image || null,
        title: nested.title || nested.description || "Pinterest",
      };
    }
    case "twitter": {
      const variants = Array.isArray(data.url) ? data.url : [];
      const hd = variants.find((v) => v.hd)?.hd;
      const sd = variants.find((v) => v.sd)?.sd;
      return {
        videoUrl: hd || sd || null,
        audioUrl: null,
        imageUrl: null,
        title: data.title || "Twitter / X",
      };
    }
    case "youtube":
      return {
        videoUrl: data.mp4 || null,
        audioUrl: data.mp3 || null,
        imageUrl: null,
        title: data.title || "YouTube",
      };
    default:
      return { videoUrl: null, audioUrl: null, imageUrl: null, title: null };
  }
}

function pickHeaders(fileUrl) {
  if (/rapidcdn\.app/i.test(fileUrl)) {
    return { "User-Agent": "TelegramBot (like TwitterBot)" };
  }
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*"
  };
}

async function downloadToBuffer(fileUrl) {
  const headers = pickHeaders(fileUrl);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.get(fileUrl, {
        responseType: "arraybuffer",
        headers,
        timeout: 60000,
        maxContentLength: MAX_ATTACHMENT_BYTES,
        maxBodyLength: MAX_ATTACHMENT_BYTES,
      });
      if (res.data && res.data.byteLength > 0) return Buffer.from(res.data);
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return null;
}

async function handleDownload({ url, wantsAudio, message, api, event }) {
  const platform = detectPlatform(url);
  if (!platform) return false;

  if (event) api.setMessageReaction("⏳", event.messageID);

  try {
    const result = await fetchMedia(platform.endpoint, url);
    if (!result.ok) {
      if (event) api.setMessageReaction("❌", event.messageID);
      message.reply(result.message);
      return true;
    }

    const { videoUrl, audioUrl, imageUrl, title } = extractMediaLinks(platform.name, result.data);

    let targetUrl = null;
    let ext = "mp4";
    let note = null;

    if (wantsAudio) {
      if (audioUrl) {
        targetUrl = audioUrl;
        ext = "mp3";
      } else if (videoUrl) {
        targetUrl = videoUrl;
        ext = "mp4";
        note = "Audio isn't available for this platform — sending the video instead.";
      }
    } else if (videoUrl) {
      targetUrl = videoUrl;
      ext = "mp4";
    } else if (imageUrl) {
      targetUrl = imageUrl;
      ext = "jpg";
    }

    if (!targetUrl) {
      if (event) api.setMessageReaction("❌", event.messageID);
      message.reply("Couldn't find a downloadable file for that link.");
      return true;
    }

    const buffer = await downloadToBuffer(targetUrl);
    if (!buffer) {
      if (event) api.setMessageReaction("❌", event.messageID);
      message.reply("Failed to download the file after multiple attempts.");
      return true;
    }
    if (buffer.byteLength > MAX_ATTACHMENT_BYTES) {
      if (event) api.setMessageReaction("❌", event.messageID);
      message.reply("File size exceeds Messenger's 25MB limit.");
      return true;
    }

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `${Date.now()}.${ext}`);
    await fs.writeFile(filePath, buffer);

    await message.reply({
      body: note ? `${title}\n${note}` : title,
      attachment: fs.createReadStream(filePath),
    });

    if (event) api.setMessageReaction("✅", event.messageID);
    fs.remove(filePath).catch(() => {});
    return true;
  } catch (e) {
    console.error("[ALLDL ERROR]:", e?.response?.data || e.message || e);
    if (event) api.setMessageReaction("❌", event.messageID);
    message.reply("An error occurred while processing the download.");
    return true;
  }
}

module.exports = {
  config: {
    name: "alldl",
    aliases: ["adl"],
    version: "1.0",
    author: "Neoaz 🐊",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Download from TikTok, Instagram, Facebook, Pinterest, Twitter/X, YouTube" },
    longDescription: {
      en: "Download media from a supported link, or toggle auto-download for the thread with 'on'/'off'.",
    },
    category: "media",
    guide: { en: "{pn} <url> [--a]\n{pn} on\n{pn} off" },
  },

  onStart: async function ({ message, args, event, api, threadsData }) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "on" || sub === "off") {
      if (sub === "on") enabledThreads.add(event.threadID);
      else enabledThreads.delete(event.threadID);
      saveToggleState();
      return message.reply(
        sub === "on"
          ? "alldl auto-download is now ON for this thread. Paste a link or share a video and I'll grab it automatically."
          : "alldl auto-download is now OFF for this thread."
      );
    }

    const raw = args.join(" ");
    const url = extractUrlFromText(raw);
    if (!url) return message.reply("Usage: {pn} <url> [--a] | {pn} on | {pn} off");

    const wantsAudio = hasAudioFlag(raw);
    const handled = await handleDownload({ url, wantsAudio, message, api, event });
    if (!handled) {
      message.reply("That link isn't from a supported platform (TikTok, Instagram, Facebook, Pinterest, Twitter/X, YouTube).");
    }
  },

  onChat: async function ({ message, event, api }) {
    if (!enabledThreads.has(event.threadID)) return;
    if (event.senderID === api.getCurrentUserID()) return;

    const resolved = resolveRequest(event);
    if (!resolved) return;

    await handleDownload({ ...resolved, message, api, event });
  },
};
