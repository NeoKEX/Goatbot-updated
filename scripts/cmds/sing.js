const axios = require("axios");
const { youtube } = require("btch-downloader");
const fs = require("fs-extra");
const path = require("path");
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
                version: "1.2", // Updated version
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

                let videoInfo;
                let isSearch = false;
                let videoResult; // To hold the search result object if applicable

                if (urlYtb) {
                        videoInfo = await getVideoInfo(query);
                } else {
                        isSearch = true;
                        let result;
                        try {
                                result = await search(query);
                        }
                        catch (err) {
                                return message.reply(getLang("error", err.message));
                        }
                        
                        if (result.length < 2)
                                return message.reply(getLang("noResult", query));
                        
                        // Use the 2nd result (index 1) for search query based execution
                        videoResult = result[1];
                        videoInfo = await getVideoInfo(videoResult.id);
                        videoInfo.title = videoResult.title;
                }

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        
                        const { title, videoId, video_url } = videoInfo;
                        const MAX_SIZE = 27262976;

                        const ytData = await youtube(video_url);
                        
                        // Check for download failure (common issue with btch-downloader)
                        if (!ytData || !ytData.mp3) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("noAudio"));
                        }

                        const audioUrl = ytData.mp3;
                        
                        // Use the title obtained from search or default if not found
                        const songTitle = isSearch ? videoResult.title : title; 

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

async function search(keyWord) {
        try {
                const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyWord)}`;
                const res = await axios.get(url, {
                        headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                });
                
                // FIXED PARSING LOGIC: YouTube often wraps data in a script tag. 
                const dataMatch = res.data.match(/var ytInitialData = ({.*?});/);
                if (!dataMatch) {
                        const error = new Error("Failed to extract search data from YouTube (Parse Error 1)");
                        error.code = "SEARCH_DATA_ERROR";
                        throw error;
                }
                
                const getJson = JSON.parse(dataMatch[1]);
                
                // Using optional chaining to navigate the complex JSON structure safely
                const primaryContents = getJson?.contents?.twoColumnSearchResultsRenderer?.primaryContents;
                const videos = primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
                
                const results = [];
                for (const video of videos) {
                    const videoRenderer = video.videoRenderer;
                    if (videoRenderer && videoRenderer.lengthText?.simpleText && videoRenderer.videoId) {
                        try {
                            results.push({
                                id: videoRenderer.videoId,
                                title: videoRenderer.title?.runs?.[0]?.text || "Unknown",
                                thumbnail: videoRenderer.thumbnail?.thumbnails?.pop()?.url,
                                time: videoRenderer.lengthText.simpleText
                            });
                        } catch (e) {
                            continue;
                        }
                    }
                }
                
                if (results.length === 0) {
                        const error = new Error("No videos found");
                        error.code = "NO_VIDEOS_ERROR";
                        throw error;
                }
                
                return results;
        }
        catch (e) {
                if (e.code) throw e;
                const error = new Error("Cannot search video: " + e.message);
                error.code = "SEARCH_VIDEO_ERROR";
                throw error;
        }
}

async function getVideoInfo(videoId) {
        try {
                videoId = videoId.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)/);
                videoId = videoId[2] !== undefined ? videoId[2].split(/[^0-9a-z_\-]/i)[0] : videoId[0];

                if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                        throw new Error("Invalid YouTube video ID");
                }

                const result = {
                        videoId,
                        title: "YouTube Video",
                        video_url: `https://youtu.be/${videoId}`,
                        lengthSeconds: "0",
                        thumbnails: []
                };

                return result;
        } catch (e) {
                throw new Error("Failed to get video info: " + e.message);
        }
}

function parseAbbreviatedNumber(string) {
        const match = string
                .replace(',', '.')
                .replace(' ', '')
                .match(/([\d,.]+)([MK]?)/);
        if (match) {
                let [, num, multi] = match;
                num = parseFloat(num);
                return Math.round(multi === 'M' ? num * 1000000 :
                        multi === 'K' ? num * 1000 : num);
        }
        return null;
}