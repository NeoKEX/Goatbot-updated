const { getStreamFromURL } = global.utils;

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getSafeName(usersData, userID) {
  let name = await usersData.getName(userID);
  if (!name) {
    await usersData.refreshInfo(userID);
    name = await usersData.getName(userID);
  }
  return name || "Unknown User";
}

function generateLovePercentages(base) {
  return [
    `${base}`,
    `${(base + Math.random()).toFixed(2)}`,
    `${Math.min(100, base + 5)}`,
    `${Math.max(0, base - 5)}`,
    `${(Math.random() * 100).toFixed(2)}`,
    `${100 + Math.floor(Math.random() * 20)}`,
    `${-Math.floor(Math.random() * 20)}`
  ];
}

function getLoveLabel(value) {
  const v = parseFloat(value);
  if (v < 0) return "💔 Toxic vibes";
  if (v <= 20) return "😶 No spark";
  if (v <= 40) return "🌱 Just starting";
  if (v <= 60) return "😊 Friendly feelings";
  if (v <= 80) return "💕 Sweet connection";
  if (v <= 100) return "🔥 True love";
  return "💞 Beyond limits!";
}

module.exports = {
  config: {
    name: "pair",
    version: "2.1",
    author: "Toshiro Editz",
    countDown: 10,
    role: 0,
    description: {
      en: "Pair two users together with love percentage"
    },
    category: "love",
    guide: {
      en:
        "{pn}\n" +
        "{pn} @user\n" +
        "{pn} @user1 @user2\n" +
        "{pn} <uid1> <uid2>\n" +
        "(reply also supported)"
    }
  },

  onStart: async function ({ event, threadsData, message, usersData, args }) {
    const { senderID, threadID, mentions } = event;
    const mentionIDs = Object.keys(mentions || {});
    let user1, user2;

    /* 🔹 Fetch priority */
    if (event.messageReply) {
      user1 = senderID;
      user2 = event.messageReply.senderID;

    } else if (mentionIDs.length === 2) {
      [user1, user2] = mentionIDs;

    } else if (mentionIDs.length === 1) {
      user1 = senderID;
      user2 = mentionIDs[0];

    } else if (args.length >= 2 && !isNaN(args[0]) && !isNaN(args[1])) {
      user1 = args[0];
      user2 = args[1];

    } else {
      /* 🔹 Random pairing (gender based) */
      const threadData = await threadsData.get(threadID);
      const members = threadData.members.filter(m => m.inGroup);

      const sender = members.find(m => m.userID === senderID);
      if (!sender?.gender)
        return message.reply("❌ Please set your gender to use random pair.");

      const partnerList = members.filter(
        m =>
          m.userID !== senderID &&
          m.gender &&
          m.gender !== sender.gender
      );

      if (!partnerList.length)
        return message.reply("⚠ No suitable partner found.");

      user1 = senderID;
      user2 = getRandomItem(partnerList).userID;
    }

    /* 🔹 Names */
    const [name1, name2] = await Promise.all([
      getSafeName(usersData, user1),
      getSafeName(usersData, user2)
    ]);

    /* 🔹 Graph API avatars */
    const avatar1 =
      `https://graph.facebook.com/${user1}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

    const avatar2 =
      `https://graph.facebook.com/${user2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

    /* 🔹 Love calculation */
    const base = Math.floor(Math.random() * 100) + 1;
    const rate = getRandomItem(generateLovePercentages(base));
    const label = getLoveLabel(rate);

    const body =
      `💘 𝗣𝗔𝗜𝗥 𝗠𝗔𝗧𝗖𝗛 💘\n\n` +
      `❤️ @${name1} × @${name2}\n` +
      `💖 Love Rate: ${rate}%\n` +
      `${label}`;

    return message.reply({
      body,
      mentions: [
        { tag: `@${name1}`, id: user1 },
        { tag: `@${name2}`, id: user2 }
      ],
      attachment: [
        await getStreamFromURL(avatar1),
        await getStreamFromURL(avatar2)
      ]
    });
  }
};
