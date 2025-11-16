const axios = require('axios');

module.exports = {
        config: {
                name: "pinterest",
                version: "2.0",
                author: "Your Name",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Tìm kiếm hình ảnh từ Pinterest với phân trang và lựa chọn",
                        en: "Search images from Pinterest with pagination and selection"
                },
                category: "media",
                guide: {
                        vi: "   {pn} <từ khóa>: Tìm 10 hình ảnh (phản hồi 1-10 để chọn, 'next' để trang tiếp)"
                                + "\n   {pn} <từ khóa> -<số>: Hiển thị lưới với số hình ảnh chỉ định",
                        en: "   {pn} <query>: Search 10 images (reply 1-10 to select, 'next' for next page)"
                                + "\n   {pn} <query> -<number>: Display grid with specified number of images"
                }
        },

        langs: {
                vi: {
                        missingQuery: "⚠️ Vui lòng nhập từ khóa tìm kiếm!\nVí dụ: {pn} coffee",
                        searching: "🔍 Đang tìm kiếm trên Pinterest...",
                        noResults: "❌ Không tìm thấy kết quả cho: %1",
                        error: "❌ Lỗi khi tìm kiếm: %1",
                        pageTitle: "📌 Pinterest - Trang %1/%2\n🔎 Từ khóa: %3\n\n",
                        instruction: "\n\n💡 Phản hồi tin nhắn này với:\n• Số 1-%1 để xem hình\n• 'next' để trang tiếp\n• 'prev' để trang trước",
                        invalidChoice: "⚠️ Vui lòng chọn số từ 1-%1",
                        sendingImage: "📤 Đang gửi hình ảnh #%1...",
                        imageTitle: "📌 Pinterest Image #%1\n📝 %2",
                        noMorePages: "⚠️ Đây là trang cuối cùng!",
                        firstPage: "⚠️ Đây là trang đầu tiên!",
                        sessionExpired: "⚠️ Phiên tìm kiếm đã hết hạn. Vui lòng tìm kiếm lại.",
                        gridTitle: "📌 Pinterest - Lưới %1 hình\n🔎 Từ khóa: %2\n\n",
                        apiError: "❌ Lỗi API Pinterest. Vui lòng kiểm tra API key hoặc thử lại sau."
                },
                en: {
                        missingQuery: "⚠️ Please enter search query!\nExample: {pn} coffee",
                        missingQuery: "⚠️ Please enter search query!\nExample: {pn} coffee",
                        searching: "🔍 Searching on Pinterest...",
                        noResults: "❌ No results found for: %1",
                        error: "❌ Error while searching: %1",
                        pageTitle: "📌 Pinterest - Page %1/%2\n🔎 Query: %3\n\n",
                        instruction: "\n\n💡 Reply to this message with:\n• Number 1-%1 to view image\n• 'next' for next page\n• 'prev' for previous page",
                        invalidChoice: "⚠️ Please choose number 1-%1",
                        sendingImage: "📤 Sending image #%1...",
                        imageTitle: "📌 Pinterest Image #%1\n📝 %2",
                        noMorePages: "⚠️ This is the last page!",
                        firstPage: "⚠️ This is the first page!",
                        sessionExpired: "⚠️ Search session expired. Please search again.",
                        gridTitle: "📌 Pinterest - Grid of %1 images\n🔎 Query: %2\n\n",
                        apiError: "❌ Pinterest API error. Please check API key or try again later."
                }
        },

        onStart: async function ({ message, args, event, getLang, commandName }) {
                const API_KEY = "pina_AMAWU4YXAAL64BAAGCACCDVNYBGYZGQBACGSP5KV4YTC3L4KNT33RHMGWY3IE5VO4FFYXUJIH7LOWKRPLREFG4Z4QZXYVAYA";

                if (args.length === 0) {
                        return message.reply(getLang("missingQuery").replace(/{pn}/g, commandName));
                }

                // Check if custom count is specified (e.g., "coffee -5")
                let customCount = null;
                let query = args.join(" ");
                
                const countMatch = query.match(/\s-(\d+)$/);
                if (countMatch) {
                        customCount = parseInt(countMatch[1]);
                        query = query.replace(/\s-\d+$/, "").trim();
                        
                        if (customCount < 1 || customCount > 50) {
                                customCount = 10;
                        }
                }

                if (!query) {
                        return message.reply(getLang("missingQuery").replace(/{pn}/g, commandName));
                }

                const loadingMsg = await message.reply(getLang("searching"));

                try {
                        // Search Pinterest
                        const response = await axios.get('https://api.pinterest.com/v5/search/pins', {
                                headers: {
                                        'Authorization': `Bearer ${API_KEY}`,
                                        'Content-Type': 'application/json'
                                },
                                params: {
                                        query: query,
                                        limit: customCount || 50 // Get more for pagination
                                }
                        });

                        if (!response.data || !response.data.items || response.data.items.length === 0) {
                                return message.reply(getLang("noResults", query));
                        }

                        const allPins = response.data.items;
                        const bookmark = response.data.bookmark || null;

                        if (customCount) {
                                // Grid mode: Show specified number of images
                                return await sendGridImages(message, allPins.slice(0, customCount), query, customCount, getLang);
                        } else {
                                // Pagination mode: Show 10 images with numbered list
                                return await sendPaginatedList(message, event, allPins, query, 1, bookmark, getLang);
                        }

                } catch (error) {
                        console.error("Pinterest API Error:", error.response?.data || error.message);
                        
                        if (error.response?.status === 401) {
                                return message.reply(getLang("apiError"));
                        }
                        
                        return message.reply(getLang("error", error.message));
                }
        },

        onReply: async function ({ message, event, Reply, getLang }) {
                const { author, commandName, messageID, searchData } = Reply;
                
                if (event.senderID !== author) return;

                const userReply = event.body.trim().toLowerCase();

                // Check if session expired
                if (!searchData || !searchData.allPins) {
                        return message.reply(getLang("sessionExpired"));
                }

                const { allPins, query, currentPage, totalPages, bookmark } = searchData;
                const pinsPerPage = 10;

                // Handle navigation
                if (userReply === 'next') {
                        if (currentPage >= totalPages) {
                                // Try to fetch more pins if bookmark exists
                                if (bookmark) {
                                        return await fetchAndShowNextPage(message, event, query, allPins, bookmark, currentPage, getLang);
                                } else {
                                        return message.reply(getLang("noMorePages"));
                                }
                        }
                        return await sendPaginatedList(message, event, allPins, query, currentPage + 1, bookmark, getLang);
                }

                if (userReply === 'prev' || userReply === 'previous') {
                        if (currentPage <= 1) {
                                return message.reply(getLang("firstPage"));
                        }
                        return await sendPaginatedList(message, event, allPins, query, currentPage - 1, bookmark, getLang);
                }

                // Handle number selection
                const choice = parseInt(userReply);
                if (isNaN(choice) || choice < 1 || choice > pinsPerPage) {
                        return message.reply(getLang("invalidChoice", pinsPerPage));
                }

                // Calculate actual index
                const actualIndex = (currentPage - 1) * pinsPerPage + choice - 1;
                
                if (actualIndex >= allPins.length) {
                        return message.reply(getLang("invalidChoice", pinsPerPage));
                }

                const selectedPin = allPins[actualIndex];
                
                // Send the selected image
                await message.reply(getLang("sendingImage", choice));
                return await sendSingleImage(message, selectedPin, choice, getLang);
        }
};

async function sendPaginatedList(message, event, allPins, query, page, bookmark, getLang) {
        const pinsPerPage = 10;
        const totalPages = Math.ceil(allPins.length / pinsPerPage);
        const startIdx = (page - 1) * pinsPerPage;
        const endIdx = Math.min(startIdx + pinsPerPage, allPins.length);
        const pagePins = allPins.slice(startIdx, endIdx);

        let messageText = getLang("pageTitle", page, totalPages, query);
        
        pagePins.forEach((pin, index) => {
                const title = pin.title || pin.description || "Untitled";
                const truncatedTitle = title.length > 50 ? title.substring(0, 47) + "..." : title;
                messageText += `${startIdx + index + 1}. ${truncatedTitle}\n`;
        });

        messageText += getLang("instruction", pinsPerPage);

        const sentMessage = await message.reply(messageText);

        // Store search data for onReply
        global.GoatBot.onReply.set(sentMessage.messageID, {
                commandName: "pinterest",
                messageID: sentMessage.messageID,
                author: event.senderID,
                searchData: {
                        allPins,
                        query,
                        currentPage: page,
                        totalPages,
                        bookmark
                }
        });
}

async function fetchAndShowNextPage(message, event, query, currentPins, bookmark, currentPage, getLang) {
        const API_KEY = "pina_AMAWU4YXAAL64BAAGCACCDVNYBGYZGQBACGSP5KV4YTC3L4KNT33RHMGWY3IE5VO4FFYXUJIH7LOWKRPLREFG4Z4QZXYVAYA";
        
        try {
                const response = await axios.get('https://api.pinterest.com/v5/search/pins', {
                        headers: {
                                'Authorization': `Bearer ${API_KEY}`,
                                'Content-Type': 'application/json'
                        },
                        params: {
                                query: query,
                                limit: 50,
                                bookmark: bookmark
                        }
                });

                if (response.data && response.data.items && response.data.items.length > 0) {
                        const newPins = [...currentPins, ...response.data.items];
                        const newBookmark = response.data.bookmark || null;
                        return await sendPaginatedList(message, event, newPins, query, currentPage + 1, newBookmark, getLang);
                } else {
                        return message.reply(getLang("noMorePages"));
                }
        } catch (error) {
                console.error("Pinterest pagination error:", error.message);
                return message.reply(getLang("noMorePages"));
        }
}

async function sendSingleImage(message, pin, number, getLang) {
        try {
                const imageUrl = pin.media?.images?.original?.url || 
                               pin.media?.images?.['600x']?.url ||
                               pin.image_large_url ||
                               pin.image_medium_url;
                
                if (!imageUrl) {
                        return message.reply("❌ Image URL not available");
                }

                const title = pin.title || pin.description || "Pinterest Image";
                const pinUrl = pin.link || `https://www.pinterest.com/pin/${pin.id}`;
                
                const stream = await global.utils.getStreamFromURL(imageUrl);
                
                return message.reply({
                        body: getLang("imageTitle", number, title) + `\n🔗 ${pinUrl}`,
                        attachment: stream
                });
        } catch (error) {
                console.error("Error sending image:", error.message);
                return message.reply("❌ Error downloading image: " + error.message);
        }
}

async function sendGridImages(message, pins, query, count, getLang) {
        try {
                let messageText = getLang("gridTitle", count, query);
                const attachments = [];

                for (let i = 0; i < Math.min(pins.length, count); i++) {
                        const pin = pins[i];
                        const title = pin.title || pin.description || "Untitled";
                        const truncatedTitle = title.length > 40 ? title.substring(0, 37) + "..." : title;
                        messageText += `${i + 1}. ${truncatedTitle}\n`;

                        const imageUrl = pin.media?.images?.original?.url || 
                                       pin.media?.images?.['600x']?.url ||
                                       pin.image_large_url ||
                                       pin.image_medium_url;
                        
                        if (imageUrl) {
                                try {
                                        const stream = await global.utils.getStreamFromURL(imageUrl);
                                        attachments.push(stream);
                                } catch (error) {
                                        console.error(`Error downloading image ${i + 1}:`, error.message);
                                }
                        }
                }

                if (attachments.length === 0) {
                        return message.reply("❌ Could not download any images");
                }

                return message.reply({
                        body: messageText,
                        attachment: attachments
                });
        } catch (error) {
                console.error("Error sending grid:", error.message);
                return message.reply("❌ Error sending images: " + error.message);
        }
}
