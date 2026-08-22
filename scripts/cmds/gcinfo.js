module.exports = {
  config: {
    name: "gcinfo",
    version: "1.4",
    author: "Toshiro Editz",
    role: 0,
    shortDescription: "Stylish group info",
    category: "box chat",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    const threadID = event.threadID;

    if (!event.isGroup)
      return api.sendMessage("❌ | This command works only in groups.", threadID);

    try {
      const info = await api.getThreadInfo(threadID);

      const groupName = info.threadName || "Unnamed Group";
      const members = info.participantIDs.length;
      const admins = info.adminIDs.length;
      const emoji = info.emoji || "🌐";
      const approval = info.approvalMode ? "𝗢𝗡 ✅" : "𝗢𝗙𝗙 ❌";

      let male = 0, female = 0, unknown = 0;

      for (const uid of info.participantIDs) {
        try {
          const data = await usersData.get(uid);
          const gender = data?.gender;

          if (gender == 2 || gender == "MALE") male++;
          else if (gender == 1 || gender == "FEMALE") female++;
          else unknown++;
        } catch {
          unknown++;
        }
      }

      // ✅ Admin Names
      let adminNames = [];
      for (const admin of info.adminIDs) {
        try {
          const name = await usersData.getName(admin.id);
          adminNames.push(`👑 ${name}`);
        } catch {
          adminNames.push("👑 Unknown Admin");
        }
      }

      // ✅ Group Picture
      let attachment = null;
      try {
        const picURL = `https://graph.facebook.com/${threadID}/picture?width=512&height=512`;
        attachment = await global.utils.getStreamFromURL(picURL);
      } catch {}

      const msg =
`╭─❍ 「 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢 」 ❍─╮
│
│ 🏷️ 𝗡𝗮𝗺𝗲 ➤ ${groupName}
│ ${emoji} 𝗘𝗺𝗼𝗷𝗶 ➤ ${emoji}
│
│ 👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀 ➤ ${members}
│ 🛡️ 𝗔𝗱𝗺𝗶𝗻𝘀 ➤ ${admins}
│
│ 👦 𝗠𝗮𝗹𝗲 ➤ ${male}
│ 👧 𝗙𝗲𝗺𝗮𝗹𝗲 ➤ ${female}
│ ❓ 𝗨𝗻𝗸𝗻𝗼𝘄𝗻 ➤ ${unknown}
│
│ ✅ 𝗔𝗽𝗽𝗿𝗼𝘃𝗮𝗹 ➤ ${approval}
│
├───────────────
│ 👑 𝗔𝗗𝗠𝗜𝗡𝗦
${adminNames.map(n => `│ ${n}`).join("\n")}
│
╰───────────────╯`;

      api.sendMessage(
        attachment ? { body: msg, attachment } : msg,
        threadID
      );

    } catch (err) {
      console.error("GCINFO ERROR:", err);
      api.sendMessage("❌ | Failed to fetch group info.", threadID);
    }
  }
};