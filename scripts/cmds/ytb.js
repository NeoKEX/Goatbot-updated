const fs = require("fs-extra");
const yts = require("yt-search");
const { YtDlp } = require("ytdlp-nodejs");
const { formatNumber } = global.utils;

module.exports = {
        config: {
                name: "ytb",
                version: "2.2",
                author: "NeoKEX",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Tải video, audio hoặc xem thông tin video trên YouTube",
                        en: "Download video, audio or view video information on YouTube"
                },
                category: "media",
                guide: {
                        vi: "   {pn} [video|-v] [<tên video>|<link video>]: dùng để tải video từ youtube."
                                + "\n   {pn} [audio|-a] [<tên video>|<link video>]: dùng để tải audio từ youtube"
                                + "\n   {pn} [info|-i] [<tên video>|<link video>]: dùng để xem thông tin video từ youtube"
                                + "\n   Ví dụ:"
                                + "\n    {pn} -v Fallen Kingdom"
                                + "\n    {pn} -a Fallen Kingdom"
                                + "\n    {pn} -i Fallen Kingdom",
                        en: "   {pn} [video|-v] [<video name>|<video link>]: use to download video from youtube."
                                + "\n   {pn} [audio|-a] [<video name>|<video link>]: use to download audio from youtube"
                                + "\n   {pn} [info|-i] [<video name>|<video link>]: use to view video information from youtube"
                                + "\n   Example:"
                                + "\n    {pn} -v Fallen Kingdom"
                                + "\n    {pn} -a Fallen Kingdom"
                                + "\n    {pn} -i Fallen Kingdom"
                }
        },

        langs: {
                vi: {
                        error: "❌ Đã xảy ra lỗi: %1",
                        noResult: "⭕ Không có kết quả tìm kiếm nào phù hợp với từ khóa %1",
                        choose: "%1Reply tin nhắn với số để chọn hoặc nội dung bất kì để gỡ",
                        video: "video",
                        audio: "âm thanh",
                        downloading: "⬇️ Đang tải xuống %1 \"%2\"",
                        noVideo: "⭕ Rất tiếc, không tìm thấy video nào có dung lượng nhỏ hơn 83MB",
                        noAudio: "⭕ Rất tiếc, không tìm thấy audio nào có dung lượng nhỏ hơn 26MB",
                        tooLarge: "⭕ File quá lớn (%1MB), vượt quá giới hạn %2MB",
                        info: "💠 Tiêu đề: %1\n🏪 Channel: %2\n👨‍👩‍👧‍👦 Subscriber: %3\n⏱ Thời gian video: %4\n👀 Lượt xem: %5\n👍 Lượt thích: %6\n🆙 Ngày tải lên: %7\n🔠 ID: %8\n🔗 Link: %9"
                },
                en: {
                        error: "❌ An error occurred: %1",
                        noResult: "⭕ No search results match the keyword %1",
                        choose: "%1Reply to the message with a number to choose or any content to cancel",
                        video: "video",
                        audio: "audio",
                        downloading: "⬇️ Downloading %1 \"%2\"",
                        noVideo: "⭕ Sorry, no video was found with a size less than 83MB",
                        noAudio: "⭕ Sorry, no audio was found with a size less than 26MB",
                        tooLarge: "⭕ File too large (%1MB), exceeds limit of %2MB",
                        info: "💠 Title: %1\n🏪 Channel: %2\n👨‍👩‍👧‍👦 Subscriber: %3\n⏱ Video duration: %4\n👀 View count: %5\n👍 Like count: %6\n🆙 Upload date: %7\n🔠 ID: %8\n🔗 Link: %9"
                }
        },

        onStart: async function ({ args, message, event, commandName, getLang }) {
                let type;
                switch (args[0]) {
                        case "-v":
                        case "video":
                                type = "video";
                                break;
                        case "-a":
                        case "-s":
                        case "audio":
                        case "sing":
                                type = "audio";
                                break;
                        case "-i":
                        case "info":
                                type = "info";
                                break;
                        default:
                                return message.SyntaxError();
                }

                const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
                const urlYtb = checkurl.test(args[1]);

                if (urlYtb) {
                        const videoId = extractVideoId(args[1]);
                        await handle({ type, videoId, message, getLang });
                        return;
                }

                const keyWord = args.slice(1).join(" ");
                if (!keyWord) {
                        return message.SyntaxError();
                }

                const maxResults = 6;

                let result;
                try {
                        const searchResult = await yts(keyWord);
                        result = searchResult.videos.slice(0, maxResults);
                }
                catch (err) {
                        return message.reply(getLang("error", err.message));
                }

                if (result.length == 0) {
                        return message.reply(getLang("noResult", keyWord));
                }

                let msg = "";
                let i = 1;
                const thumbnails = [];

                for (const video of result) {
                        thumbnails.push(global.utils.getStreamFromURL(video.thumbnail));
                        msg += `${i++}. ${video.title}\nTime: ${video.timestamp}\nChannel: ${video.author.name}\n\n`;
                }

                message.reply({
                        body: getLang("choose", msg),
                        attachment: await Promise.all(thumbnails)
                }, (err, info) => {
                        global.GoatBot.onReply.set(info.messageID, {
                                commandName,
                                messageID: info.messageID,
                                author: event.senderID,
                                result,
                                type
                        });
                });
        },

        onReply: async ({ event, api, Reply, message, getLang }) => {
                const { result, type } = Reply;
                const choice = event.body;
                if (!isNaN(choice) && choice <= 6 && choice >= 1) {
                        const infoChoice = result[choice - 1];
                        const videoId = infoChoice.videoId;
                        api.unsendMessage(Reply.messageID);
                        await handle({ type, videoId, message, getLang });
                }
                else {
                        api.unsendMessage(Reply.messageID);
                }
        }
};

function extractVideoId(url) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&\n?#]+)/);
        return match ? match[1] : url;
}

async function handle({ type, videoId, message, getLang }) {
        try {
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                const ytDlp = new YtDlp();

                if (type == "info") {
                        const videoInfo = await ytDlp.getInfoAsync(videoUrl);
                        
                        const duration = parseInt(videoInfo.duration) || 0;
                        const hours = Math.floor(duration / 3600);
                        const minutes = Math.floor((duration % 3600) / 60);
                        const seconds = Math.floor(duration % 60);
                        const time = `${hours ? hours + ":" : ""}${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
                        
                        const formattedDate = videoInfo.upload_date ? 
                                `${videoInfo.upload_date.slice(0, 4)}-${videoInfo.upload_date.slice(4, 6)}-${videoInfo.upload_date.slice(6, 8)}` : 
                                "Unknown";

                        const msg = getLang("info", 
                                videoInfo.title || "Unknown", 
                                videoInfo.uploader || videoInfo.channel || "Unknown",
                                videoInfo.channel_follower_count ? formatNumber(videoInfo.channel_follower_count) : "N/A",
                                time, 
                                formatNumber(videoInfo.view_count || 0), 
                                formatNumber(videoInfo.like_count || 0), 
                                formattedDate, 
                                videoId, 
                                `https://youtu.be/${videoId}`
                        );

                        return message.reply({
                                body: msg,
                                attachment: await global.utils.getStreamFromURL(videoInfo.thumbnail || videoInfo.thumbnails?.[0]?.url)
                        });
                }

                if (type == "video") {
                        const MAX_SIZE = 83 * 1024 * 1024;
                        
                        const title = await ytDlp.getTitleAsync(videoUrl);
                        const msgSend = await message.reply(getLang("downloading", getLang("video"), title));

                        let savePath;
                        try {
                                savePath = __dirname + `/tmp/${videoId}_${Date.now()}.mp4`;

                                await ytDlp.downloadAsync(videoUrl, {
                                        output: savePath,
                                        format: 'best[ext=mp4][filesize<83M]/best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best'
                                });

                                const stats = await fs.stat(savePath);
                                if (stats.size > MAX_SIZE) {
                                        await fs.unlink(savePath);
                                        return message.reply(getLang("tooLarge", Math.round(stats.size / 1024 / 1024), 83));
                                }

                                await message.reply({
                                        body: title,
                                        attachment: fs.createReadStream(savePath)
                                });

                                await fs.unlink(savePath);
                                message.unsend(msgSend.messageID);
                        } catch (err) {
                                if (savePath && await fs.pathExists(savePath)) {
                                        await fs.unlink(savePath);
                                }
                                return message.reply(getLang("error", err.message || "Video download failed"));
                        }
                }

                if (type == "audio") {
                        const MAX_SIZE = 26 * 1024 * 1024;
                        
                        const title = await ytDlp.getTitleAsync(videoUrl);
                        const msgSend = await message.reply(getLang("downloading", getLang("audio"), title));

                        let savePath;
                        try {
                                savePath = __dirname + `/tmp/${videoId}_${Date.now()}.m4a`;

                                await ytDlp.downloadAsync(videoUrl, {
                                        output: savePath,
                                        format: 'bestaudio[ext=m4a][filesize<26M]/bestaudio[filesize<26M]/bestaudio',
                                        extractAudio: true
                                });

                                const stats = await fs.stat(savePath);
                                if (stats.size > MAX_SIZE) {
                                        await fs.unlink(savePath);
                                        return message.reply(getLang("tooLarge", Math.round(stats.size / 1024 / 1024), 26));
                                }

                                await message.reply({
                                        body: title,
                                        attachment: fs.createReadStream(savePath)
                                });

                                await fs.unlink(savePath);
                                message.unsend(msgSend.messageID);
                        } catch (err) {
                                if (savePath && await fs.pathExists(savePath)) {
                                        await fs.unlink(savePath);
                                }
                                return message.reply(getLang("error", err.message || "Audio download failed"));
                        }
                }
        }
        catch (error) {
                return message.reply(getLang("error", error.message));
        }
}
