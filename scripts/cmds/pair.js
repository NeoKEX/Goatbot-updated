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

function generateLovePercentages(number) {
  return [
    `${number}`,
    `${(number + Math.random()).toFixed(2)}`,
    `${number + 1}`,
    `${number - 1}`,
    `${Math.min(100, number + 10)}`,
    `${Math.max(0, number - 10)}`,
    `${(Math.random() * 100).toFixed(2)}`,
    `${-Math.floor(Math.random() * 100)}`,
    `${100 + Math.floor(Math.random() * 20)}`,
    `${(Math.random()).toFixed(2)}`
  ];
}

function getLoveLabel(value) {
  const v = parseFloat(value);
  if (v < 0) return "💔 Toxic vibes";
  if (v === 0) return "😶 No spark";
  if (v > 0 && v <= 25) return "🌱 Just starting";
  if (v > 25 && v <= 50) return "😊 Friendly feelings";
  if (v > 50 && v <= 75) return "💕 Sweet connection";
  if (v > 75 && v <= 100) return "🔥 Passionate love";
  if (v > 100) return "💞 Over the limit!";
  return "💌 Undefined fate";
}

module.exports = {
  config: {
    name: "pair",
    version: "1.3",
    author: "Rulex-al | xnil6x",
    countDown: 10,
    role: 0,
    description: {
      en: "Pair two users together (random, mention 1, or mention 2) with love percentage"
    },
    category: "love",
    guide: {
      en: "{pn} | {pn} @user | {pn} @user1 @user2"
    }
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    const { senderID, threadID, mentions } = event;
    const mentionIDs = Object.keys(mentions || {});

    let user1, user2;

    if (mentionIDs.length === 2) {
      [user1, user2] = mentionIDs;

    } else if (mentionIDs.length === 1) {
      user1 = senderID;
      user2 = mentionIDs[0];

    } else {
      const threadData = await threadsData.get(threadID);
      const members = threadData.members.filter(m => m.inGroup);

      const sender = members.find(m => m.userID === senderID);
      if (!sender?.gender)
        return message.reply("❌ Set your gender to use this command.");

      const partnerList = members.filter(
        m => m.userID !== senderID &&
          m.gender === (sender.gender === "FEMALE" ? "MALE" : "FEMALE")
      );
      if (!partnerList.length)
        return message.reply("⚠ No opposite-gender members found.");

      const partner = getRandomItem(partnerList);
      user1 = senderID;
      user2 = partner.userID;
    }

    const [name1, avatar1, name2, avatar2] = await Promise.all([
      getSafeName(usersData, user1), usersData.getAvatarUrl(user1),
      getSafeName(usersData, user2), usersData.getAvatarUrl(user2)
    ]);

    const number = Math.floor(Math.random() * 100) + 1;
    const variations = generateLovePercentages(number);
    const randomRate = getRandomItem(variations);
    const loveLabel = getLoveLabel(randomRate);

    const body =
      `❤ @${name1} 💕 @${name2} ❤\n` +
      `💖 Love: ${randomRate}%\n` +
      `${loveLabel}`;

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