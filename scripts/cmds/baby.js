module.exports.config = {
  name: "bb", // main command is now bb
  aliases: ["baby", "babyface"], // optional alternative triggers
  version: "1.0",
  author: "Zaevii",
  countDown: 5,
  adminOnly: false,
  description: "Send a random cute baby picture",
  guide: "{pn}bb - Sends a random baby picture",
  usePrefix: true
};

module.exports.onStart = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // Array of baby image URLs
    const babyImages = [
      "https://i.imgur.com/1ZQZ1Zb.jpg",
      "https://i.imgur.com/J6fKjvC.jpg",
      "https://i.imgur.com/fKz5V3p.jpg",
      "https://i.imgur.com/0lWvJ9r.jpg",
      "https://i.imgur.com/8X0GqWx.jpg"
    ];

    // Pick a random image
    const randomImage = babyImages[Math.floor(Math.random() * babyImages.length)];

    // Send message
    api.sendMessage(
      {
        body: "👶 Here's a cute baby picture for you!",
        attachment: await global.utils.getStreamFromURL(randomImage, "baby.jpg")
      },
      threadID,
      () => {}
    );
  } catch (err) {
    console.error("[BB Command Error]", err.message);
    api.sendMessage(`⚠️ Error fetching baby image: ${err.message}`, threadID, messageID);
  }
};
