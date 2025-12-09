const a = require("yt-search");
const b = require("axios");
const c = require("fs");
const d = require("path");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

async function f(g) {
  const h = await b({ url: g, responseType: "stream" });
  return h.data;
}

module.exports = {
  config: {
    name: "youtube",
    aliases: ["ytb"],
    version: "0.0.9",
    author: "ArYAN",
    countDown: 5,
    role: 0,
    description: { en: "Search and download YouTube video/audio" },
    category: "media",
    guide: { en: "{pn} -v <query|url>\n{pn} -a <query|url>" }
  },

  onStart: async function ({ api: i, args, event: k, commandName: l }) {
    let e;
    try {
      const apiConfig = await b.get(nix);
      e = apiConfig.data && apiConfig.data.api;
      if (!e) {
        return i.sendMessage("❌ Configuration Error: GitHub apis.json is missing the 'api' field.", k.threadID, k.messageID);
      }
    } catch (error) {
      console.error("API Config Fetch Error:", error);
      return i.sendMessage("❌ Failed to fetch API configuration from GitHub.", k.threadID, k.messageID);
    }

    const aryan = args;
    const n = aryan[0];
    if (!["-v", "-a"].includes(n)) return i.sendMessage("❌ Usage: /ytb [-a|-v] <search or YouTube URL>", k.threadID, k.messageID);

    const o = aryan.slice(1).join(" ");
    if (!o) return i.sendMessage("❌ Provide a search query or URL.", k.threadID, k.messageID);

    if (o.startsWith("http")) {
      if (n === "-v") return await p(o, "mp4", i, k, e);
      else return await p(o, "mp3", i, k, e);
    }

    try {
      const q = await a(o);
      const r = q.videos.slice(0, 6);
      if (r.length === 0) return i.sendMessage("❌ No results found.", k.threadID, k.messageID);

      let s = "";
      r.forEach((t, u) => {
        const v = n === "-v" ? t.seconds ? "360p" : "Unknown" : "128kbps";
        s += `• Title: ${t.title}\n• Quality: ${v}\n\n`;
      });

      const w = await Promise.all(r.map(x => f(x.thumbnail)));

      i.sendMessage(
        { body: s + "Reply with number (1-6) to download", attachment: w },
        k.threadID,
        (err, y) => {
          global.GoatBot.onReply.set(y.messageID, {
            commandName: l,
            messageID: y.messageID,
            author: k.senderID,
            results: r,
            type: n,
            baseApi: e
          });
        },
        k.messageID
      );
    } catch (err) {
      console.error(err);
      i.sendMessage("❌ Failed to search YouTube.", k.threadID, k.messageID);
    }
  },

  onReply: async function ({ event: z, api: A, Reply: B }) {
    const { results: C, type: D, baseApi: e } = B;
    if (!e) return A.sendMessage("❌ Configuration lost. Please try the command again.", z.threadID, z.messageID);

    const E = parseInt(z.body);

    if (isNaN(E) || E < 1 || E > C.length) return A.sendMessage("❌ Invalid selection. Choose 1-6.", z.threadID, z.messageID);

    const F = C[E - 1];
    await A.unsendMessage(B.messageID);

    if (D === "-v") await p(F.url, "mp4", A, z, e);
    else await p(F.url, "mp3", A, z, e);
  }
};

async function p(q, r, s, t, e) {
  try {
    const { data: u } = await b.get(`${e}/yx?url=${encodeURIComponent(q)}&type=${r}`);
    const v = u.download_url;
    if (!u.status || !v) throw new Error("API failed");

    const w = d.join(__dirname, `yt_${Date.now()}.${r}`);
    const x = c.createWriteStream(w);
    const y = await b({ url: v, responseType: "stream" });
    y.data.pipe(x);

    await new Promise((resolve, reject) => {
      x.on("finish", resolve);
      x.on("error", reject);
    });

    await s.sendMessage(
      { attachment: c.createReadStream(w) },
      t.threadID,
      () => c.unlinkSync(w),
      t.messageID
    );
  } catch (err) {
    console.error(`${r} error:`, err.message);
    s.sendMessage(`❌ Failed to download ${r}.`, t.threadID, t.messageID);
  }
}
