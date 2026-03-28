const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "say",
    version: "1.7",
    author: "Samir Œ",
    countDown: 5,
    role: 0,
    category: "tts",
    description: "bot will make your text into voice.",
    guide: {
      en: "{pn} your text (default will be 'en') | {pn} your text | [use two words ISO 639-1 code, ex: English-en, Bangla-bn, Hindi-hi or more, search Google for your language code]"
    }
  },

  onStart: async function ({ api, args, message, event }) {
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);

    let text;
    let number = 'en';

    if (event.type === "message_reply") {
      text = event.messageReply.body;
    } else {
      if (args && args.length > 0) {
        if (args.includes("|")) {
          const splitArgs = args.join(" ").split("|").map(arg => arg.trim());
          text = splitArgs[0];
          number = splitArgs[1] || 'en';
        } else {
          text = args.join(" ");
        }
      } else {
        text = '';
      }
    }

    if (!text) {
      return message.reply(`Please provide some text. Example:\n${p}say hi there`);
    }

    const path = `${__dirname}/tmp/tts.mp3`;

    try {
      if (text.length <= 150) {
        const response = await axios({
          method: "get",
          url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=${number}&client=tw-ob&q=${encodeURIComponent(text)}`,
          responseType: "stream"
        });

        const writer = fs.createWriteStream(path);
        response.data.pipe(writer);
        writer.on("finish", () => {
          message.reply({
            body: text,
            attachment: fs.createReadStream(path)
          }, () => {
            fs.remove(path);
          });
        });
      } else {
        const chunkSize = 150;
        const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, 'g'));

        for (let i = 0; i < chunks.length; i++) {
          const response = await axios({
            method: "get",
            url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=${number}&client=tw-ob&q=${encodeURIComponent(chunks[i])}`,
            responseType: "stream"
          });

          const writer = fs.createWriteStream(path, { flags: i === 0 ? 'w' : 'a' });
          response.data.pipe(writer);

          if (i === chunks.length - 1) {
            writer.on("finish", () => {
              message.reply({
                body: text,
                attachment: fs.createReadStream(path)
              }, () => {
                fs.remove(path);
              });
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      message.reply("An error occurred while trying to convert your text to speech or send it as an attachment. Please try again later.");
    }
  }
};