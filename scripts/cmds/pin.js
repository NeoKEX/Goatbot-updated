const axios = require("axios");
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const { getStreamFromURL } = global.utils;

async function generatePinterestCanvas(imageObjects, query, page, totalPages) {
  const canvasWidth = 800;
  const canvasHeight = 1600;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🔍 Pinterest Searcher', 20, 45);

  ctx.font = '16px Arial';
  ctx.fillStyle = '#b0b0b0';
  ctx.fillText(`Search results of "${query}", Showing up to ${imageObjects.length} images.`, 20, 75);

  const numColumns = 3;
  const padding = 15;
  const columnWidth = (canvasWidth - (padding * (numColumns + 1))) / numColumns;
  const columnHeights = Array(numColumns).fill(100);

  const loadedPairs = await Promise.all(
    imageObjects.map(obj =>
      loadImage(obj.url)
        .then(img => ({ img, originalIndex: obj.originalIndex, url: obj.url }))
        .catch(e => {
          console.error(`Failed to load image: ${obj.url}`, e && e.message);
          return null;
        })
    )
  );

  const successful = loadedPairs.filter(x => x !== null);

  if (successful.length === 0) {
    ctx.fillStyle = '#ff6666';
    ctx.font = '16px Arial';
    ctx.fillText(`No images could be loaded for this page.`, 20, 110);
    const outputPath = path.join(__dirname, 'cache', `pinterest_page_${Date.now()}.png`);
    await fs.ensureDir(path.dirname(outputPath));
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return { outputPath, displayedMap: [] };
  }

  let displayNumber = 0;
  const displayedMap = [];

  for (let i = 0; i < successful.length; i++) {
    const { img, originalIndex } = successful[i];

    const minHeight = Math.min(...columnHeights);
    const columnIndex = columnHeights.indexOf(minHeight);

    const x = padding + columnIndex * (columnWidth + padding);
    const y = minHeight + padding;

    const scale = columnWidth / img.width;
    const scaledHeight = img.height * scale;

    ctx.drawImage(img, x, y, columnWidth, scaledHeight);

    displayNumber += 1;
    displayedMap.push(originalIndex);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, 50, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${displayNumber}`, x + 25, y + 12);

    ctx.fillStyle = '#b0b0b0';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${img.width} x ${img.height}`, x + columnWidth - 6, y + scaledHeight - 6);

    columnHeights[columnIndex] += scaledHeight + padding;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  const footerY = Math.max(...columnHeights) + 40;
  ctx.fillText(`Anchestor - Page ${page}/${totalPages}`, canvasWidth / 2, footerY);

  const outputPath = path.join(__dirname, 'cache', `pinterest_page_${Date.now()}.png`);
  await fs.ensureDir(path.dirname(outputPath));
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  return { outputPath, displayedMap };
}

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["Pinterest", "pin"],
    version: "2.2",
    author: "Mahi--",
    countDown: 10,
    role: 0,
    shortDescription: "Search Pinterest for images",
    longDescription: "Search Pinterest for images, with canvas view for Browse.",
    category: "Image",
    guide: {
      en: "{pn} query [-count]\n" +
        "• If count is used, it sends images directly.\n" +
        "• If no count, it shows an interactive canvas.\n" +
        "• Example: {pn} cute cat -5 (direct send)\n" +
        "• Example: {pn} anime wallpaper (canvas view)"
    }
  },

  onStart: async function({ api, args, message, event }) {
    let processingMessage = null;
    try {
      let count = null;
      const countArg = args.find(arg => /^-\d+$/.test(arg));
      if (countArg) {
        count = parseInt(countArg.slice(1), 10);
        args = args.filter(arg => arg !== countArg);
      }
      const query = args.join(" ").trim();
      if (!query) {
        return message.reply("Please provide a search query.");
      }

      processingMessage = await message.reply("🔍 Searching on Pinterest...");

      const res = await axios.get(`https://egret-driving-cattle.ngrok-free.app/api/pin?query=${encodeURIComponent(query)}&num=90`);
      const allImageUrls = res.data.results || [];

      if (allImageUrls.length === 0) {
        if (processingMessage) await message.unsend(processingMessage.messageID).catch(() => { });
        return message.reply(`No images found for "${query}".`);
      }

      if (count) {
        const urls = allImageUrls.slice(0, count);
        const streams = await Promise.all(urls.map(url => getStreamFromURL(url).catch(() => null)));
        const validStreams = streams.filter(s => s);

        if (processingMessage) await message.unsend(processingMessage.messageID).catch(() => { });

        return message.reply({
          body: `Here are ${validStreams.length} image(s) for "${query}":`,
          attachment: validStreams
        });

      } else {
        const imagesPerPage = 21;
        const totalPages = Math.ceil(allImageUrls.length / imagesPerPage);
        const startIndex = 0;
        const endIndex = Math.min(allImageUrls.length, imagesPerPage);
        const imagesForPage1 = allImageUrls.slice(startIndex, endIndex).map((url, idx) => ({
          url,
          originalIndex: startIndex + idx
        }));

        const { outputPath: canvasPath, displayedMap } = await generatePinterestCanvas(imagesForPage1, query, 1, totalPages);

        const sentMessage = await message.reply({
          body: `🖼️ Found ${allImageUrls.length} images for "${query}".\nReply with a number (shown on canvas) to get that image, or "next" for more.`,
          attachment: fs.createReadStream(canvasPath)
        });

        fs.unlink(canvasPath, (err) => {
          if (err) console.error(err);
        });

        global.GoatBot.onReply.set(sentMessage.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          allImageUrls,
          query,
          imagesPerPage,
          currentPage: 1,
          totalPages,
          displayedMap,
          displayCount: Array.isArray(displayedMap) ? displayedMap.length : 0
        });

        if (processingMessage) await message.unsend(processingMessage.messageID).catch(() => { });
      }

    } catch (error) {
      console.error(error);
      if (processingMessage) {
        try { await message.unsend(processingMessage.messageID); } catch (e) { }
      }
      message.reply("An error occurred. The server or API might be down.");
    }
  },

  onReply: async function({ api, event, message, Reply }) {
    try {
      if (!Reply) return message.reply("Session expired. Please run the command again.");

      const { author, allImageUrls, query, imagesPerPage, currentPage, totalPages, displayedMap, displayCount } = Reply;
      if (event.senderID !== author) return;

      const input = (event.body || "").trim().toLowerCase();

      if (input === 'next') {
        if (currentPage >= totalPages) {
          return message.reply("This is the last page of results.");
        }
        const nextPage = currentPage + 1;
        const startIndex = (nextPage - 1) * imagesPerPage;
        const endIndex = Math.min(startIndex + imagesPerPage, allImageUrls.length);

        const imagesForNextPage = allImageUrls.slice(startIndex, endIndex).map((url, idx) => ({
          url,
          originalIndex: startIndex + idx
        }));

        const processingMessage = await message.reply(`Loading page ${nextPage}...`);
        const { outputPath: canvasPath, displayedMap: nextDisplayedMap } = await generatePinterestCanvas(imagesForNextPage, query, nextPage, totalPages);

        const sentMessage = await message.reply({
          body: `🖼️ Page ${nextPage}/${totalPages}.\nReply with a number (shown on canvas) to get that image, or "next" for more.`,
          attachment: fs.createReadStream(canvasPath)
        });
        fs.unlink(canvasPath, (err) => {
          if (err) console.error(err);
        });

        await message.unsend(processingMessage.messageID).catch(() => { });

        global.GoatBot.onReply.set(sentMessage.messageID, {
          commandName: this.config.name,
          author,
          allImageUrls,
          query,
          imagesPerPage,
          currentPage: nextPage,
          totalPages,
          displayedMap: nextDisplayedMap,
          displayCount: Array.isArray(nextDisplayedMap) ? nextDisplayedMap.length : 0
        });

      } else {
        const number = parseInt(input, 10);
        if (!isNaN(number) && number > 0) {
          if (!Array.isArray(displayedMap) || typeof displayCount !== 'number') {
            return message.reply("This page's images aren't available anymore. Please run the command again or type 'next'.");
          }

          if (number > displayCount) {
            return message.reply(`Invalid number. The current canvas shows only ${displayCount} image(s). Choose a number from 1 to ${displayCount}, or type "next" to load more images.`);
          }

          const originalIndex = displayedMap[number - 1];
          if (originalIndex == null || originalIndex < 0 || originalIndex >= allImageUrls.length) {
            return message.reply(`Could not find that image. Please try again or request a different number.`);
          }
          const imageUrl = allImageUrls[originalIndex];
          const stream = await getStreamFromURL(imageUrl).catch(() => null);
          if (!stream) return message.reply("Failed to fetch the requested image.");
          await message.reply({
            body: `Image #${number} for query "${query}":`,
            attachment: stream
          });
        } else {
          return message.reply(`Reply with a number (from the canvas) to get that image, or "next" for more pages.`);
        }
      }
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while handling your reply.");
    }
  }
};