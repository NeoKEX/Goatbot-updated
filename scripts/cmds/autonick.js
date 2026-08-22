const fs = require("fs");
const path = require("path");
const dbPath = path.join(__dirname, "autonick.json");

module.exports.config = {
  name: "autonick",
  version: "5.2.0",
  author: "Toshiro Editz",
  role: 0,
  description: "Auto nickname with before/after (default after), supports quotes and special chars",
  category: "group",
  eventType: ["log:subscribe"]
};

// Initialize db
module.exports.onLoad = () => {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
};

// ========================
// Command: autonick
// Format:
// autonick tag TagName [before/after] on
// autonick off
// ========================
module.exports.onStart = async ({ api, event, args }) => {
  const data = JSON.parse(fs.readFileSync(dbPath));
  const threadID = event.threadID;

  if (!args[0]) return api.sendMessage(
    "❗ Usage:\nautonick tag TagName [before/after] on\nautonick off",
    threadID
  );

  // Turn off
  if (args[0].toLowerCase() === "off") {
    delete data[threadID];
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return api.sendMessage("✔ Autonick disabled for this group.", threadID);
  }

  if (args[0].toLowerCase() !== "tag") {
    return api.sendMessage(
      "❗ Usage:\nautonick tag TagName [before/after] on",
      threadID
    );
  }

  // Extract last argument as status
  const status = args[args.length - 1].toLowerCase();

  if (status !== "on") return api.sendMessage("❗ Last argument must be 'on'", threadID);

  // Default position = after
  let position = "after";
  const beforeAfterIndex = args.findIndex(arg => arg.toLowerCase() === "before" || arg.toLowerCase() === "after");
  if (beforeAfterIndex !== -1) position = args[beforeAfterIndex].toLowerCase();

  // Tag = all args between "tag" and position/status
  const tagArgs = args.slice(1, args.length - 1).filter((_, idx) => idx !== beforeAfterIndex - 1);
  const tag = tagArgs.join(" ");

  // Save settings
  data[threadID] = { enabled: true, tag, position };
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

  return api.sendMessage(`✔ Autonick enabled\nTag: ${tag}\nPosition: ${position}`, threadID);
};

// ========================
// Event: member joined
// Only nickname change, no message
// ========================
module.exports.onEvent = async ({ api, event }) => {
  if (!fs.existsSync(dbPath)) return;
  const data = JSON.parse(fs.readFileSync(dbPath));
  const threadID = event.threadID;

  if (!data[threadID] || data[threadID].enabled !== true) return;

  const { tag, position } = data[threadID];
  if (!tag) return;

  if (event.logMessageData.addedParticipants) {
    for (const mem of event.logMessageData.addedParticipants) {
      const uid = mem.userFbId;
      const info = await api.getUserInfo(uid);
      const name = info[uid].name || "Member";

      const finalNick = position === "before" ? `${tag} ${name}` : `${name} ${tag}`;
      api.changeNickname(finalNick, threadID, uid);
    }
  }
};