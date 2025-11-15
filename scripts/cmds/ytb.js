const ytdl = require("@distube/ytdl-core");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "video",
    aliases: ["vid", "youtubevid", "ytb"],
    version: "3.0",
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
      } else {
        try {
          const info = await ytdl.getBasicInfo(videoUrl);
          videoTitle = info.videoDetails.title;
        } catch (err) {
          console.log("Could not fetch video title:", err.message);
        }
      }

      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const fileName = `video_${Date.now()}.mp4`;
      const filePath = path.join(tempDir, fileName);

      const cookiesPath = "cookies.txt";
      let agent;
      
      if (fs.existsSync(cookiesPath)) {
        try {
          const cookieData = fs.readFileSync(cookiesPath, 'utf8');
          const cookies = cookieData.split('\n')
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
              const parts = line.split('\t');
              if (parts.length >= 7) {
                return {
                  domain: parts[0],
                  flag: parts[1] === 'TRUE',
                  path: parts[2],
                  secure: parts[3] === 'TRUE',
                  expirationDate: parseInt(parts[4]),
                  name: parts[5],
                  value: parts[6]
                };
              }
              return null;
            })
            .filter(cookie => cookie !== null);
          
          if (cookies.length > 0) {
            agent = ytdl.createAgent(cookies);
          }
        } catch (err) {
          console.warn("⚠️ Could not load cookies:", err.message);
        }
      }

      const options = {
        quality: 'highest',
        filter: 'audioandvideo'
      };

      if (agent) {
        options.agent = agent;
      }

      const stream = ytdl(videoUrl, options);
      const writeStream = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        stream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
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
      const errorMsg = e.message?.includes("Sign in")
        ? "⚠️ This video may require authentication. Try adding a valid cookies.txt file."
        : e.message || "An unknown error occurred.";
      api.sendMessage(`❌ Error: ${errorMsg}`, event.threadID, event.messageID);
    }
  }
};