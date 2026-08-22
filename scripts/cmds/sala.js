const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const jimp = require('jimp');

module.exports = {
  config: {
    name: "sala",
    version: "1.0.0",
    author: "Toshiro Editz ",
    countDown: 5,
    role: 0,
    shortDescription: "Tui amar vaieee bonding",
    longDescription: "Bonding edit: sender & tagged user photo",
    category: "fun",
    guide: "{pn} @tag"
  },

  // ⬇️ Background file download for GoatBot V2
  onLoad: async () => {
    const dir = path.join(__dirname, "cache/canvas");
    const bgPath = path.join(dir, "sala_bg.jpg");

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(bgPath)) {
      const bgURL = "https://i.postimg.cc/jdp17LNv/IMG-6498.jpg";
      const getBG = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(bgPath, Buffer.from(getBG));
    }
  },

  // MAIN COMMAND
  onStart: async function ({ event, api }) {
    const threadID = event.threadID;
    const messageID = event.messageID;

    const mention = Object.keys(event.mentions);
    if (!mention[0])
      return api.sendMessage("একজনকে ট্যাগ কর সালা বানানোর জন্য 😈", threadID, messageID);

    const one = event.senderID;
    const two = mention[0];

    try {
      const imgPath = await makeImage({ one, two });

      api.sendMessage(
        {
          body: "তুই আমার বন্ধু না, তুই আমার ভাইই 😏🔥",
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );
    } catch (e) {
      api.sendMessage("❌ কিছু একটা সমস্যা হয়েছে!", threadID, messageID);
      console.log(e);
    }
  }
};

// ========== IMAGE MAKER FUNCTION ==========
async function makeImage({ one, two }) {
  const canvasDir = path.join(__dirname, "cache/canvas");

  const bg = await jimp.read(path.join(canvasDir, "sala_bg.jpg"));
  const output = path.join(canvasDir, `sala_${one}_${two}.png`);

  const av1 = path.join(canvasDir, `avt_${one}.png`);
  const av2 = path.join(canvasDir, `avt_${two}.png`);

  // Download avatars
  const url = id => `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  fs.writeFileSync(av1, Buffer.from((await axios.get(url(one), { responseType: "arraybuffer" })).data));
  fs.writeFileSync(av2, Buffer.from((await axios.get(url(two), { responseType: "arraybuffer" })).data));

  // Circle crop
  const circleOne = await jimp.read(await makeCircle(av1));
  const circleTwo = await jimp.read(await makeCircle(av2));

  // Positioning (GoatBot V2 style)
  bg.resize(500, 300)
    .composite(circleOne.resize(70, 70), 120, 110)
    .composite(circleTwo.resize(70, 70), 310, 110);

  fs.writeFileSync(output, await bg.getBufferAsync("image/png"));

  fs.unlinkSync(av1);
  fs.unlinkSync(av2);

  return output;
}

// Circle function
async function makeCircle(image) {
  const img = await jimp.read(image);
  img.circle();
  return await img.getBufferAsync("image/png");
  }
