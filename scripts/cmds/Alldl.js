const axios = require('axios');
const fs = require('fs');
const path = require('path');

const supportedDomains = [
  { domain: 'facebook.com', cookieFile: null },
  { domain: 'instagram.com', cookieFile: 'insta.txt' },
  { domain: 'youtube.com', cookieFile: 'yt.txt' },
  { domain: 'youtu.be', cookieFile: 'yt.txt' },
  { domain: 'pinterest.com', cookieFile: null },
  { domain: "tiktok.com", cookieFile: null },
];

function getMainDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === 'youtu.be') {
      return 'youtube.com';
    }
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  } catch (e) {
    return null;
  }
}

function getDefaultCookie(domain) {
  const domainEntry = supportedDomains.find(entry => entry.domain === domain);
  return domainEntry ? domainEntry.cookieFile : null;
}

function parseArgs(args) {
  const params = {};
  args.forEach((arg, i) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2).toLowerCase();
      const value = args[i + 1];
      switch (key) {
        case 'maxsize':
        case 'ms':
        case 'fs':
          if (!isNaN(Number(value))) params.filesize = Number(value);
          break;
        case 'type':
        case 'format':
        case 'media':
        case 'f':
          if (['video', 'audio'].includes(value.toLowerCase())) {
            params.format = value.toLowerCase();
          }
          break;
        case 'cookie':
        case 'cookies':
        case 'c':
          const cookiePath = path.join(process.cwd(), value);
          if (fs.existsSync(cookiePath)) {
            params.cookies = fs.readFileSync(cookiePath, 'utf-8');
          }
          break;
        default:
          break;
      }
    }
  });
  return params;
}

async function download({ url, params, message, event }) {
  try {
    const domain = getMainDomain(url);
    
    if (!params.cookies) {
      const defaultCookieFile = getDefaultCookie(domain);
      if (defaultCookieFile) {
        const cookiePath = path.join(process.cwd(), defaultCookieFile);
        if (fs.existsSync(cookiePath)) {
          params.cookies = fs.readFileSync(cookiePath, 'utf-8');
        }
      }
    }
    
    if (!params.filesize) {
      params.filesize = 25;
    }
    
    const requestBody = {
      url,
      ...(params.format && { format: params.format }),
      ...(params.filesize && { filesize: params.filesize }),
      ...(params.cookies && { cookies: params.cookies }),
    };
    
    const apiUrl = (await axios.get('https://raw.githubusercontent.com/Tanvir0999/stuffs/refs/heads/main/raw/addresses.json')).data.megadl;
    const response = await axios.post(apiUrl, requestBody);
    const data = response.data;
    
    await message.reply({
      body: `• ${data.title.length > 50 ? data.title.slice(0, 50) + "..." : data.title}\n• Duration: ${data.duration}\n• Upload Date: ${data.upload_date || '--'}\n• Source: ${data.source}\n\n• Stream: ${data.url}`,
      attachment: await global.utils.getStreamFromUrl(data.url),
    });
    
    message.reaction('✅', event.messageID);
  } catch (error) {
    message.reaction('❌', event.messageID);
    return { repay: 50 };
  }
}

module.exports = {
  config: {
    name: 'download',
    aliases: ['downloader', 'megadl', 'fb', 'fbdl', 'facebook', 'insta', 'instadl', 'instagram', 'yt', 'ytdl'],
    version: '2.3',
    author: 'tanvir',
    countDown: 5,
    role: 0,
    longDescription: 'Download videos or audios from supported platforms. Supports parameters for file size, format, and cookies.',
    category: 'media',
    guide: {
      en: {
        body: `{pn} [URL] [optional parameters]\n\n
  # Examples:
     • {pn} https://facebook.com/video --fs 100 --type audio --c cookies.txt\n
     • {pn} https://youtube.com/watch?v=abc --maxsize 200 --format video\n
     • {pn} https://instagram.com/p/xyz\n\n
  # Parameters:
     • URL: The video or audio URL from a supported platform.\n
     • --fs or --maxsize: Maximum file size in MB (default: 25).\n
     • --type or --format: Download type ('video' or 'audio', optional).\n
     • --c or --cookie: Path to a cookie file (defaults based on platform).`,
      },
    },
  },
  
  onStart: async function({ message, args, event, threadsData, role }) {
    if (args[0] === 'chat' && (args[1] === 'on' || args[1] === 'off') || args[0] === 'on' || args[0] === 'off') {
      if (role < 1) {
        return message.reply('You do not have permission to change auto-download settings.');
      }
      const choice = args[0] === 'on' || args[1] === 'on';
      const gcData = await threadsData.get(event.threadID, "data");
      await threadsData.set(event.threadID, { data: { ...gcData, autoDownload: choice } });
      return message.reply(`Auto-download has been turned ${choice ? 'on' : 'off'} for this group.`);
    }
    
    const url = args.find(arg => /^https?:\/\//.test(arg));
    if (!url) {
      return message.reply('Please provide a valid URL to download.');
    }
    
    const domain = getMainDomain(url);
    const isSupported = supportedDomains.some(entry => entry.domain === domain);
    if (!isSupported) {
      return message.reply('This platform is not enabled/supported. Please ask Admin to request support of this platform.');
    }
    
    const paramArgs = args.filter(arg => arg !== url);
    const params = parseArgs(paramArgs);
    
    message.reaction('⏳', event.messageID);
    await download({ url, params, message, event });
  },
  
  onChat: async function({ event, message, threadsData }) {
    const threadData = await threadsData.get(event.threadID);
    if (!threadData.data.autoDownload || threadData.data.autoDownload === false || event.senderID === global.botID) {
      return;
    }
    
    try {
      const urlRegex = /https:\/\/[^\s]+/;
      const match = event.body.match(urlRegex);
      if (match) {
        const url = match[0];
        const domain = getMainDomain(url);
        
        const isSupported = supportedDomains.some(entry => entry.domain === domain);
        if (isSupported) {
          const prefix = await global.utils.getPrefix(event.threadID);
          if (event.body.startsWith(prefix)) return;
          
          message.reaction('⏳', event.messageID);
          const params = {};
          await download({ url, params, message, event });
        }
      }
    } catch (error) {
      message.reaction('', event.messageID);
      console.error('onChat Error:', error);
    }
  },
};
