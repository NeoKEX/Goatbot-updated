const axios = require("axios");


module.exports = {

  config: {

    name: "anime",

    aliases: ["anipub", "watchanime"],

    version: "2.6",

    author: "Neoaz ゐ",

    countDown: 5,

    role: 0,

    shortDescription: { en: "Search anime and get watch links with pagination" },

    longDescription: { en: "Search anime, get info and browse all episode links page by page." },

    category: "entertainment",

    guide: { en: "{pn} <anime name>" }

  },


  onStart: async function ({ message, args, event, commandName }) {

    const query = args.join(" ");

    if (!query) return message.reply("[!] Please provide an anime name.");


    message.reaction("🔍", event.messageID);


    try {

      const searchRes = await axios.get(`https://www.anipub.xyz/api/search/${encodeURIComponent(query)}`);

      const results = searchRes.data;


      if (!results || results.length === 0) return message.reply("[x] No anime found with that name.");


      let msg = "--- SEARCH RESULTS ---\n\n";

      results.slice(0, 10).forEach((item, index) => {

        msg += `${index + 1}. ${item.Name}\n`;

      });

      msg += "\n[#] Reply with a number to see details.";


      message.reply(msg, (err, info) => {

        global.GoatBot.onReply.set(info.messageID, {

          commandName,

          messageID: info.messageID,

          author: event.senderID,

          results: results.slice(0, 10),

          type: "selection"

        });

      });

    } catch (err) {

      message.reply("[x] Error fetching data from AniPub.");

    }

  },


  onReply: async function ({ message, event, Reply, commandName }) {

    if (event.senderID !== Reply.author) return;

    const input = event.body.trim().toLowerCase();


    try {

      if (Reply.type === "selection") {

        const index = parseInt(input) - 1;

        if (isNaN(index) || !Reply.results[index]) return message.reply("[!] Invalid selection.");


        const animeId = Reply.results[index].Id;

        message.reaction("⏳", event.messageID);


        const [infoRes, streamRes] = await Promise.all([

          axios.get(`https://www.anipub.xyz/anime/api/details/${animeId}`),

          axios.get(`https://www.anipub.xyz/v1/api/details/${animeId}`)

        ]);


        const { local, jikan } = infoRes.data;

        const { local: streamData } = streamRes.data;


        const fixImg = p => p?.startsWith('http') ? p : `https://anipub.xyz/${p}`;

        const image = fixImg(local.ImagePath || local.Cover);


        let details = `>> ${local.Name.toUpperCase()} <<\n`;

        details += `----------------------------\n`;

        details += `[*] Score: ${local.MALScore || "N/A"}\n`;

        details += `[*] Status: ${local.Status}\n`;

        details += `[*] Episodes: ${local.epCount || "N/A"}\n`;

        details += `[*] Genres: ${local.Genres?.join(", ") || "N/A"}\n\n`;

        details += `[i] Synopsis: ${jikan?.synopsis?.slice(0, 250)}...\n\n`;

        details += `[>] Reply with "watch" for links.`;


        const stream = await global.utils.getStreamFromURL(image);

        message.reply({ body: details, attachment: stream }, (err, info) => {

          global.GoatBot.onReply.set(info.messageID, {

            commandName,

            messageID: info.messageID,

            author: event.senderID,

            streamData,

            currentPage: 0,

            type: "details"

          });

        });

      } 

      

      else if (Reply.type === "details" && (input === "watch" || input === "next")) {

        const { streamData, currentPage } = Reply;

        if (!streamData) return message.reply("[x] Links not available.");


        const cleanLink = (l) => l.replace('src=', '');

        const itemsPerPage = 15;

        

        const allEpisodes = [{ ep: 1, link: streamData.link }];

        if (streamData.ep) {

          streamData.ep.forEach((e, i) => allEpisodes.push({ ep: i + 2, link: e.link }));

        }


        const start = currentPage * itemsPerPage;

        const end = start + itemsPerPage;

        const pagedEpisodes = allEpisodes.slice(start, end);


        if (pagedEpisodes.length === 0) return message.reply("[!] No more episodes.");


        let links = `--- ${streamData.name.toUpperCase()} EPISODES ---\n`;

        links += `(Page: ${currentPage + 1})\n----------------------------\n\n`;

        

        pagedEpisodes.forEach(e => {

          links += `(+) Ep ${e.ep}: ${cleanLink(e.link)}\n`;

        });


        if (end < allEpisodes.length) {

          links += `\n[>>] Reply with "next" for more.`;

        } else {

          links += `\n[v] End of list.`;

        }


        message.reply(links, (err, info) => {

          global.GoatBot.onReply.set(info.messageID, {

            commandName,

            messageID: info.messageID,

            author: event.senderID,

            streamData,

            currentPage: currentPage + 1,

            type: "details"

          });

        });

      }

    } catch (err) {

      message.reply("[x] Request failed.");

    }

  }

};
