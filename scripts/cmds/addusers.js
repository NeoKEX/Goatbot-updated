function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const DELAY_MIN_MS = 4000;
const DELAY_MAX_MS = 8000;
function randomDelay() {
  return DELAY_MIN_MS + Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS));
}

const PROGRESS_EVERY = 10;

module.exports = {
  config: {
    name: "addusers",
    aliases: ["bulkadd", "importmembers"],
    version: "1.0",
    author: "Neoaz 🐊",
    countDown: 10,
    role: 2,
    shortDescription: { en: "Add all members from another group into this one" },
    longDescription: { en: "Adds every member of a source group (by thread ID) into the group where the command is run, with a delay between each add to reduce the risk of Facebook flagging the account." },
    category: "box chat",
    guide: { en: "{pn} <sourceThreadID>" }
  },

  onStart: async function ({ message, api, event, args, threadsData }) {
    const sourceThreadID = args[0];
    const destThreadID = event.threadID;

    if (!sourceThreadID || isNaN(sourceThreadID)) {
      return message.reply("Usage: {pn} <sourceThreadID>");
    }
    if (sourceThreadID === destThreadID) {
      return message.reply("Source and destination can't be the same group.");
    }

    let sourceData, destData;
    try {
      sourceData = await threadsData.get(sourceThreadID);
    } catch (e) {
      return message.reply("Couldn't fetch that source thread. Make sure the bot is a member of it and the ID is correct.");
    }
    try {
      destData = await threadsData.get(destThreadID);
    } catch (e) {
      return message.reply("Couldn't fetch this group's data.");
    }

    const botID = api.getCurrentUserID();
    const destMemberIDs = new Set((destData.members || []).filter((m) => m.inGroup).map((m) => m.userID));
    const { adminIDs, approvalMode } = destData;

    const candidates = (sourceData.members || [])
      .filter((m) => m.inGroup && m.userID !== botID && !destMemberIDs.has(m.userID))
      .map((m) => m.userID);

    if (candidates.length === 0) {
      return message.reply("No addable members found — either the source group is empty, or everyone in it is already here.");
    }

    const estSeconds = Math.round((candidates.length * (DELAY_MIN_MS + DELAY_MAX_MS)) / 2 / 1000);
    await message.reply(`Adding ${candidates.length} member(s). This will take roughly ${estSeconds}s due to the delay between each add — please wait.`);

    const added = [];
    const pendingApproval = [];
    const failed = [];

    for (let i = 0; i < candidates.length; i++) {
      const uid = candidates[i];

      try {
        await api.addUserToGroup(uid, destThreadID);
        if (approvalMode === true && !adminIDs.includes(botID)) {
          pendingApproval.push(uid);
        } else {
          added.push(uid);
        }
      } catch (err) {
        failed.push({ uid, reason: err?.message || "unknown error" });
      }

      const isLast = i === candidates.length - 1;
      if (!isLast) await sleep(randomDelay());

      if (!isLast && (i + 1) % PROGRESS_EVERY === 0) {
        message.reply(`Progress: ${i + 1}/${candidates.length} processed (${added.length} added, ${failed.length} failed).`);
      }
    }

    let summary = `Done. Processed ${candidates.length} member(s).\n`;
    summary += `- Added: ${added.length}\n`;
    if (pendingApproval.length) summary += `- Sent to approval list: ${pendingApproval.length}\n`;
    if (failed.length) {
      summary += `- Failed: ${failed.length}\n`;
      const preview = failed.slice(0, 10).map((f) => `  + ${f.uid}: ${f.reason}`).join("\n");
      summary += preview;
      if (failed.length > 10) summary += `\n  ...and ${failed.length - 10} more`;
    }

    message.reply(summary);
  }
};

