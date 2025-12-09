const axios = require("axios");
const fs = require("fs-extra");
const cheerio = require("cheerio");
const { getStreamFromURL } = global.utils;

const API_BASE = "https://neosegs.fly.dev";
let cachedCategories = null;

async function getStreamAndSize(url, path = "") {
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    headers: {
      'Range': 'bytes=0-',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.xvideos.com/'
    },
    timeout: 60000
  });
  if (path)
    response.data.path = path;
  const totalLength = response.headers["content-length"];
  return {
    stream: response.data,
    size: totalLength
  };
}

async function apiList(params = {}) {
  const response = await axios.get(`${API_BASE}/api/list`, { params });
  return response.data;
}

async function apiSearchByActor(actorName, pagesize = 50) {
  const response = await axios.get(`${API_BASE}/api/search-by-actor`, {
    params: { actor_name: actorName, pagesize }
  });
  return response.data;
}

async function apiCategories() {
  if (cachedCategories) return cachedCategories;
  const response = await axios.get(`${API_BASE}/api/categories`);
  cachedCategories = response.data.categories || {};
  return cachedCategories;
}

async function getVideoById(id) {
  const response = await axios.get(`${API_BASE}/api/search`, {
    params: { ids: String(id) }
  });
  return response.data;
}

async function getDirectVideoUrl(videoName) {
  try {
    const searchUrl = 'https://www.xvideos.com/?k=' + encodeURIComponent(videoName);
    const { data: searchData } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000
    });

    const $ = cheerio.load(searchData);
    let videoPageUrl = null;

    $('.thumb-block').each((i, el) => {
      if (videoPageUrl) return;
      const link = $(el).find('a').attr('href');
      if (link && link.includes('/video')) {
        videoPageUrl = 'https://www.xvideos.com' + link;
      }
    });

    if (!videoPageUrl) return null;

    const { data: videoPage } = await axios.get(videoPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const highMatch = videoPage.match(/setVideoUrlHigh\('([^']+)'\)/);
    const lowMatch = videoPage.match(/setVideoUrlLow\('([^']+)'\)/);

    if (highMatch) return { url: highMatch[1], quality: 'high' };
    if (lowMatch) return { url: lowMatch[1], quality: 'low' };

    return null;
  } catch (err) {
    console.error("Error getting direct URL:", err.message);
    return null;
  }
}

function parseArgs(args) {
  const result = {
    type: null,
    keyword: [],
    actor: null,
    category: null,
    page: 1,
    year: null,
    sort: null,
    id: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-a":
      case "--actor":
        result.type = "actor";
        result.actor = args.slice(i + 1).filter(a => !a.startsWith("-")).join(" ");
        return result;
      case "-c":
      case "--category":
        result.type = "category";
        result.category = args[i + 1];
        i++;
        break;
      case "-i":
      case "--info":
        result.type = "info";
        result.id = args[i + 1];
        i++;
        break;
      case "-p":
      case "--page":
        result.page = parseInt(args[i + 1]) || 1;
        i++;
        break;
      case "-y":
      case "--year":
        result.year = args[i + 1];
        i++;
        break;
      case "-s":
      case "--sort":
        result.sort = args[i + 1];
        i++;
        break;
      case "list":
        result.type = "list";
        break;
      default:
        if (!arg.startsWith("-")) {
          result.keyword.push(arg);
        }
        break;
    }
  }

  if (!result.type && result.keyword.length > 0) {
    result.type = "browse";
  }

  return result;
}

module.exports = {
  config: {
    name: "segx",
    aliases: ["neosegs", "sg"],
    version: "1.3.0",
    author: "NeoKEX",
    countDown: 5,
    role: 0,
    description: {
      en: "Search and download videos from NeoSegs API"
    },
    category: "media",
    guide: {
      en: "   {pn}: browse latest videos"
        + "\n   {pn} -a <actor name>: search by actor"
        + "\n   {pn} -c <category id>: browse by category"
        + "\n   {pn} list: show all categories"
        + "\n   {pn} -i <id>: view video information"
        + "\n   {pn} -p <page>: go to page"
        + "\n   {pn} -c <id> -y <year>: filter by year"
        + "\n\n   Example:"
        + "\n    {pn}"
        + "\n    {pn} -a Jenna"
        + "\n    {pn} -c 43"
        + "\n    {pn} -c 43 -p 2"
        + "\n    {pn} list"
    }
  },

  langs: {
    vi: {
      error: "x Loi: %1",
      noResult: "! Khong tim thay ket qua",
      noResultActor: "! Khong tim thay dien vien: %1",
      noResultCategory: "! Khong tim thay danh muc: %1",
      choose: "%1\n> Reply so (1-%2) de tai video",
      downloading: "> Dang tai \"%1\"...",
      noVideo: "! Khong the tai video nay",
      videoTooBig: "! Video qua lon (>83MB)",
      info: "> %1\n\n• ID: %2\n• Danh muc: %3\n• Dien vien: %4\n• Nam: %5\n• Thoi luong: %6\n• Chat luong: %7",
      categories: "> Danh sach danh muc:\n\n%1\n\n• Dung: segx -c <id> de xem",
      categoryItem: "%1. %2 (ID: %3)",
      searchResult: "%1. %2\n   • %3 | %4 | %5 | %6",
      page: "\n\n> Trang %1/%2 | Tong: %3 video"
    },
    en: {
      error: "x Error: %1",
      noResult: "! No results found",
      noResultActor: "! No results for actor: %1",
      noResultCategory: "! No results for category: %1",
      choose: "%1\n> Reply with number (1-%2) to download",
      downloading: "> Downloading \"%1\"...",
      noVideo: "! Cannot download this video",
      videoTooBig: "! Video too large (>83MB)",
      info: "> %1\n\n• ID: %2\n• Category: %3\n• Actors: %4\n• Year: %5\n• Duration: %6\n• Quality: %7",
      categories: "> Available Categories:\n\n%1\n\n• Use: segx -c <id> to browse",
      categoryItem: "%1. %2 (ID: %3)",
      searchResult: "%1. %2\n   • %3 | %4 | %5 | %6",
      page: "\n\n> Page %1/%2 | Total: %3 videos"
    }
  },

  onStart: async function ({ args, message, event, commandName, getLang }) {
    const parsed = parseArgs(args);
    const maxResults = 10;

    try {
      switch (parsed.type) {
        case "list": {
          const categories = await apiCategories();
          if (!categories || Object.keys(categories).length === 0) {
            return message.reply(getLang("error", "No categories found"));
          }

          let categoryList = "";
          let count = 1;
          for (const [id, name] of Object.entries(categories)) {
            categoryList += getLang("categoryItem", count, name, id) + "\n";
            count++;
          }

          return message.reply(getLang("categories", categoryList));
        }

        case "info": {
          if (!parsed.id) {
            return message.SyntaxError();
          }

          const data = await getVideoById(parsed.id);
          const videos = data?.list || [];

          if (videos.length === 0) {
            return message.reply(getLang("noResult"));
          }

          const video = videos[0];
          const thumbUrl = video.poster_url || video.thumb_url;
          const thumbnails = [];
          if (thumbUrl) {
            thumbnails.push(getStreamFromURL(thumbUrl).catch(() => null));
          }

          const actors = Array.isArray(video.actor) ? video.actor.join(", ") : (video.actor || "N/A");
          const attachments = (await Promise.all(thumbnails)).filter(t => t !== null);

          return message.reply({
            body: getLang("info", 
              video.name || video.origin_name || "Unknown",
              video.id || video.slug,
              video.type_name || "N/A",
              actors,
              video.year || "N/A",
              video.time || "N/A",
              video.quality || "N/A"
            ),
            attachment: attachments.length > 0 ? attachments : undefined
          });
        }

        case "actor": {
          if (!parsed.actor) {
            return message.SyntaxError();
          }

          const data = await apiSearchByActor(parsed.actor, 50);
          const videos = data?.list || [];

          if (!videos || videos.length === 0) {
            return message.reply(getLang("noResultActor", parsed.actor));
          }

          await displayResults(videos.slice(0, maxResults), message, event, commandName, getLang, data.total || videos.length, 1, data.pagecount || 1);
          break;
        }

        case "category": {
          if (!parsed.category) {
            return message.SyntaxError();
          }

          const params = {
            t: parseInt(parsed.category),
            pg: parsed.page,
            pagesize: 20
          };

          if (parsed.year) params.year = parsed.year;
          if (parsed.sort) params.sort_direction = parsed.sort;

          const data = await apiList(params);
          const videos = data?.list || [];

          if (!videos || videos.length === 0) {
            return message.reply(getLang("noResultCategory", parsed.category));
          }

          await displayResults(videos.slice(0, maxResults), message, event, commandName, getLang, data.total || videos.length, parseInt(data.page) || parsed.page, parseInt(data.pagecount) || 1);
          break;
        }

        case "browse":
        default: {
          const params = {
            pg: parsed.page,
            pagesize: 20
          };

          if (parsed.year) params.year = parsed.year;
          if (parsed.sort) params.sort_direction = parsed.sort;

          const data = await apiList(params);
          const videos = data?.list || [];

          if (!videos || videos.length === 0) {
            return message.reply(getLang("noResult"));
          }

          await displayResults(videos.slice(0, maxResults), message, event, commandName, getLang, data.total || videos.length, parseInt(data.page) || parsed.page, parseInt(data.pagecount) || 1);
          break;
        }
      }
    } catch (err) {
      console.error("Segx Error:", err);
      return message.reply(getLang("error", err.message || "Unknown error"));
    }

    async function displayResults(videos, message, event, commandName, getLang, total, page, pageCount) {
      let msg = "";
      const thumbnails = [];
      const results = [];

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const title = video.name || video.origin_name || "Unknown";
        const category = video.type_name || "N/A";
        const year = video.year || "N/A";
        const duration = video.time || "N/A";
        const quality = video.quality || "N/A";
        const actors = Array.isArray(video.actor) ? video.actor.slice(0, 2).join(", ") : "";

        msg += getLang("searchResult", i + 1, title, category, year, duration, quality) + "\n";
        if (actors) msg += `   • Actors: ${actors}\n`;
        msg += "\n";

        const thumbUrl = video.poster_url || video.thumb_url;
        if (thumbUrl) {
          thumbnails.push(getStreamFromURL(thumbUrl).catch(() => null));
        }

        results.push(video);
      }

      msg += getLang("page", page, pageCount, total);

      const attachments = (await Promise.all(thumbnails)).filter(t => t !== null);

      message.reply({
        body: getLang("choose", msg, results.length),
        attachment: attachments.length > 0 ? attachments : undefined
      }, (err, info) => {
        if (err) return console.error("Reply error:", err);

        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          results
        });
      });
    }
  },

  onReply: async ({ event, api, Reply, message, getLang }) => {
    const { results } = Reply;
    const choice = parseInt(event.body);

    if (isNaN(choice) || choice < 1 || choice > results.length) {
      api.unsendMessage(Reply.messageID);
      return;
    }

    const video = results[choice - 1];
    api.unsendMessage(Reply.messageID);

    const title = video.name || video.origin_name || "Unknown";
    const msgSend = await message.reply(getLang("downloading", title));

    try {
      const directUrl = await getDirectVideoUrl(title);

      if (!directUrl || !directUrl.url) {
        message.unsend(msgSend.messageID);
        return message.reply(getLang("noVideo"));
      }

      const MAX_SIZE = 83 * 1024 * 1024;
      const videoId = video.id || video.slug || Date.now();
      const savePath = __dirname + `/tmp/segx_${videoId}_${Date.now()}.mp4`;

      try {
        const getStream = await getStreamAndSize(directUrl.url, `${videoId}.mp4`);

        if (getStream.size && parseInt(getStream.size) > MAX_SIZE) {
          message.unsend(msgSend.messageID);
          return message.reply(getLang("videoTooBig"));
        }

        const writeStream = fs.createWriteStream(savePath);
        getStream.stream.pipe(writeStream);

        writeStream.on("finish", async () => {
          try {
            await message.reply({
              body: `> ${title}`,
              attachment: fs.createReadStream(savePath)
            });
            message.unsend(msgSend.messageID);
          } catch (sendErr) {
            message.reply(getLang("error", sendErr.message));
          } finally {
            fs.unlink(savePath, () => {});
          }
        });

        writeStream.on("error", (err) => {
          message.unsend(msgSend.messageID);
          message.reply(getLang("error", err.message));
          fs.unlink(savePath, () => {});
        });

      } catch (streamErr) {
        console.error("Stream error:", streamErr.message);
        message.unsend(msgSend.messageID);
        return message.reply(getLang("noVideo"));
      }

    } catch (err) {
      console.error("Download error:", err);
      message.unsend(msgSend.messageID);
      return message.reply(getLang("error", err.message || "Download failed"));
    }
  }
};