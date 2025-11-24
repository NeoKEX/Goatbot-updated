const axios = require("axios");
const { youtube } = require("btch-downloader");
const fs = require("fs-extra");
const path = require("path");
const search = require("yt-search");
const { getStreamFromURL } = global.utils;

async function getStreamAndSize(url, filePath = "") {
        const response = await axios({
                method: "GET",
                url,
                responseType: "stream",
                headers: {
                        'Range': 'bytes=0-'
                }
        });
        if (filePath)
                response.data.path = filePath;
        const totalLength = response.headers["content-length"];
        return {
                stream: response.data,
                size: totalLength
        };
}

module.exports = {
        config: {
                name: "sing",
                version: "1.3",
                author: "NeoKEX",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Tải audio từ YouTube (tự động chọn kết quả đầu tiên)",
                        en: "Download audio from YouTube (automatically choose first result)"
                },
                category: "media",
                guide: {
                        vi: "   {pn} <tên bài hát>: tải audio từ YouTube"
                                + "\n   Ví dụ:"
                                + "\n    {pn} Fallen Kingdom",
                        en: "   {pn} <song name>: download audio from YouTube"
                                + "\n   Example:"
                                + "\n    {pn} Fallen Kingdom"
                }
        },

        langs: {
                vi: {
                        error: "✗ Đã xảy xảy ra lỗi: %1",
                        noResult: "⭕ Không có kết quả tìm kiếm nào phù hợp với từ khóa %1",
                        noAudio: "⭕ Rất tiếc, không tìm thấy audio nào có dung lượng nhỏ hơn 26MB"
                },
                en: {
                        error: "✗ An error occurred: %1",
                        noResult: "⭕ No search results match the keyword %1",
                        noAudio: "⭕ Sorry, no audio was found with a size less than 26MB"
                }
        },

        onStart: async function ({ args, message, event, api, getLang }) {
                let query = args.join(" ");
                if (!query) {
                        return message.SyntaxError();
                }

                query = query.includes("?feature=share") ? query.replace("?feature=share", "") : query;

                const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
                const urlYtb = checkurl.test(query);

                let videoUrl;
                let songTitle = "Unknown Song";

                if (urlYtb) {
                    videoUrl = query;
                } else {
                    let results;
                    try {
                        results = await search(query);
                    } catch (err) {
                        return message.reply(getLang("error", err.message));
                    }

                    if (!results || results.videos.length < 2)
                        return message.reply(getLang("noResult", query));

                    const videoResult = results.videos[1];
                    videoUrl = videoResult.url;
                    songTitle = videoResult.title || "Unknown Song";
                }

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const videoIdMatch = videoUrl.match(/(?:youtu\.be\/|v=)([^&?]+)/);
                        const videoId = videoIdMatch ? videoIdMatch[1] : 'temp';

                        const MAX_SIZE = 27262976;

                        const ytData = await youtube(videoUrl);

                        if (!ytData || !ytData.mp3) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("noAudio"));
                        }

                        const audioUrl = ytData.mp3;

                        const getStream = await getStreamAndSize(audioUrl, `${videoId}.mp3`);

                        const actualSize = parseInt(getStream.size);

                        if (isNaN(actualSize) || actualSize <= 0) {
                            api.setMessageReaction("❌", event.messageID, () => {}, true);
                            return message.reply(getLang("error", "Failed to determine audio file size.")); 
                        }

                        if (actualSize > MAX_SIZE) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("noAudio"));
                        }

                        const tmpDir = path.join(__dirname, "tmp");
                        fs.ensureDirSync(tmpDir);
                        const savePath = path.join(tmpDir, `${videoId}_${Date.now()}.mp3`);
                        const writeStream = fs.createWriteStream(savePath);
                        getStream.stream.pipe(writeStream);

                        writeStream.on("finish", () => {
                                message.reply({
                                        body: songTitle,
                                        attachment: fs.createReadStream(savePath)
                                }, async (err) => {
                                        if (err) {
                                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                                return message.reply(getLang("error", err.message));
                                        }
                                        fs.unlinkSync(savePath);
                                        api.setMessageReaction("✅", event.messageID, () => {}, true);
                                });
                        });

                        writeStream.on("error", (err) => {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                message.reply(getLang("error", err.message));
                        });
                } catch (err) {
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};
