const axios = require('axios');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { pipeline } = require('stream/promises');

const supportedDomains = [
  { domain: 'facebook.com' },
  { domain: 'instagram.com' },
  { domain: 'youtube.com' },
  { domain: 'youtu.be' },
  { domain: 'pinterest.com' },
  { domain: 'tiktok.com' },
  { domain: 'x.com' },
  { domain: 'twitter.com' }
];

function getMainDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === 'youtu.be') return 'youtube.com';
    const parts = hostname.split('.');
    return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  } catch (e) {
    return null;
  }
}

function getExtFromContentType(ct) {
  if (!ct) return null;
  ct = ct.toLowerCase();
  if (ct.includes('video/mp4')) return '.mp4';
  if (ct.includes('video/')) return '.mp4';
  if (ct.includes('audio/mpeg') || ct.includes('audio/mp3')) return '.mp3';
  if (ct.includes('audio/')) return '.mp3';
  return null;
}

async function download({ url, message, event }) {
  try {
    const res = await axios.get(`https://free-goat-api.onrender.com/alldl?url=${encodeURIComponent(url)}`, {
      timeout: 15000
    });
    const data = res.data;

    if (!data?.status) {
      await message.reply('Cannot download this link for now.');
      return;
    }

    const streamUrl = data?.links?.hd || data?.links?.sd || data?.links?.mp3;
    if (!streamUrl) {
      await message.reply('No downloadable stream found.');
      return;
    }

    const resp = await axios.get(streamUrl, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Referer': streamUrl
      },
      maxRedirects: 5,
      validateStatus: s => s >= 200 && s < 400
    });
    const stream = resp.data;
    const contentType = resp.headers['content-type'];
    const urlExt = (() => {
      try { return path.extname(new URL(streamUrl).pathname); } catch { return ''; }
    })();
    const ext = getExtFromContentType(contentType) || (urlExt || '.mp4');
    const tmpFile = path.join(os.tmpdir(), `alldl_${Date.now()}${ext}`);

    await pipeline(stream, fs.createWriteStream(tmpFile));

    const domain = getMainDomain(url);

    try {
      await message.reply({
        body: `Title: ${data.title}`,
        attachment: fs.createReadStream(tmpFile)
      });
      message.reaction('✅', event.messageID);
    } finally {
      fs.unlink(tmpFile).catch(() => {});
    }

  } catch (error) {
    message.reaction('❌', event.messageID);
    try {
      await message.reply('Download failed. Please try another link.');
    } catch {}
  }
}

module.exports = {
  config: {
    name: 'download',
    aliases: ['dl', 'fbdl', 'ytdl', 'instadl', 'alldl'],
    version: '2.1',
    author: 'Neoaz ゐ',
    countDown: 5,
    role: 0,
    longDescription: 'Download media automatically or via command using Free Goat API.',
    category: 'media',
    guide: {
      en: '{pn} [URL] or reply to a link'
    }
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    if (['on', 'off'].includes(args[0])) {
      if (role < 1) return message.reply('Access denied.');
      const choice = args[0] === 'on';
      const gcData = (await threadsData.get(event.threadID, "data")) || {};
      await threadsData.set(event.threadID, { data: { ...gcData, autoDownload: choice } });
      return message.reply(`Auto-download: ${choice ? 'Enabled' : 'Disabled'}`);
    }

    let url = args.find(arg => /^https?:\/\//.test(arg));
    
    if (!url && event.type === "message_reply") {
      const replyBody = event.messageReply.body;
      const match = replyBody.match(/https?:\/\/[^\s]+/);
      if (match) url = match[0];
    }

    if (!url) return message.reply('Please provide or reply to a valid link.');

    const domain = getMainDomain(url);
    if (!supportedDomains.some(d => d.domain === domain)) {
      return message.reply('Unsupported platform.');
    }

    message.reaction('⏳', event.messageID);
    await download({ url, message, event });
  },

  onChat: async function ({ event, message, threadsData }) {
    if (event.senderID === global.botID || !event.body) return;
    
    const threadData = await threadsData.get(event.threadID);
    if (!threadData?.data?.autoDownload) return;

    const urlRegex = /https?:\/\/[^\s]+/;
    const match = event.body.match(urlRegex);
    
    if (match) {
      const url = match[0];
      const domain = getMainDomain(url);
      
      if (supportedDomains.some(d => d.domain === domain)) {
        const prefix = await global.utils.getPrefix(event.threadID);
        if (event.body.startsWith(prefix)) return;

        message.reaction('⏳', event.messageID);
        await download({ url, message, event });
      }
    }
  }
};
