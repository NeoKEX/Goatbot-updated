const ytdlp = require("youtube-dl-exec");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "video",
    aliases: ["vid", "youtubevid"],
    version: "2.1",
    author: "Mahi--",
    description: "Downloads YouTube videos by URL or search query.",
    category: "Utility",
    guide: "{pn} <YouTube URL or search query>"
  },

  onStart: async function ({ api, event, args }) {
    if (!args.length)
      return api.sendMessage("❌ Please provide a YouTube URL or search query.", event.threadID, event.messageID);

    const input = args.join(" ");
    let videoUrl = input;
    let videoTitle = "Video File";
    const urlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i;

    try {
      api.setMessageReaction("🔄", event.messageID, () => {}, true);
    } catch (e) {
      console.log("Reaction (waiting) failed:", e.message);
    }

    try {
      if (!urlRegex.test(input)) {
        const search = await yts(input);
        if (!search || !search.videos.length)
          throw new Error("No results found for your search query.");
        const first = search.videos[0];
        videoUrl = first.url;
        videoTitle = first.title;
      }

      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const fileName = `video_${Date.now()}.mp4`;
      const filePath = path.join(tempDir, fileName);

      const cookiesPath = "cookies.txt";
      if (!fs.existsSync(cookiesPath))
        console.warn("⚠️ No cookies.txt file found — some videos may be blocked.");

      await ytdlp(videoUrl, {
        output: filePath,
        format: "bestvideo+bestaudio/best",
        mergeOutputFormat: "mp4",
        noCheckCertificates: true,
        geoBypass: true,
        preferFreeFormats: true,
        addHeader: [
          "referer:https://www.youtube.com/",
          "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        ],
        cookies: fs.existsSync(cookiesPath) ? cookiesPath : undefined
      });

      if (!fs.existsSync(filePath))
        throw new Error("Downloaded file not found.");

      try {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      } catch (e) {
        console.log("Reaction (success) failed:", e.message);
      }

      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      await api.sendMessage({
        body: `🎬 ${videoTitle}\n💾 Size: ${sizeMB} MB\n🔗 Link: ${videoUrl}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, event.messageID);

      fs.unlinkSync(filePath);

    } catch (e) {
      try {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      } catch (err) {
        console.log("Reaction (failure) failed:", err.message);
      }

      console.error("Download error:", e);
      const errorMsg = e.stderr?.includes("Sign in to confirm")
        ? "⚠️ YouTube requires cookies for this video. Add a valid cookies.txt file."
        : e.message || "An unknown error occurred.";
      api.sendMessage(`❌ Error: ${errorMsg}`, event.threadID, event.messageID);
    }
  }
};