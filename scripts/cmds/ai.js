const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://meta.nkx.lol";
const CONV_FILE = path.join(__dirname, "data", "aiConversations.json");

let conversations = {};

function loadConversations() {
  try {
    fs.ensureFileSync(CONV_FILE);
    const raw = fs.readFileSync(CONV_FILE, "utf8").trim();
    conversations = raw ? JSON.parse(raw) : {};
  } catch (e) {
    conversations = {};
  }
}

function saveConversations() {
  fs.ensureDirSync(path.dirname(CONV_FILE));
  fs.writeFileSync(CONV_FILE, JSON.stringify(conversations), "utf8");
}

loadConversations();

function deepCollect(obj, predicate, results = [], depth = 0) {
  if (depth > 6 || obj == null) return results;
  if (Array.isArray(obj)) {
    obj.forEach((v) => deepCollect(v, predicate, results, depth + 1));
    return results;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string" && predicate(k, v)) results.push(v);
      else deepCollect(v, predicate, results, depth + 1);
    }
  }
  return results;
}

function extractReplyText(data) {
  const hinted = deepCollect(
    data,
    (k, v) => /message|reply|response|text|content|answer|output/i.test(k) && !/id$/i.test(k) && v.trim().length > 0
  );
  if (hinted.length) return hinted.sort((a, b) => b.length - a.length)[0];

  const anyString = deepCollect(data, (k, v) => v.trim().length > 3 && !/^https?:\/\//i.test(v));
  return anyString.length ? anyString.sort((a, b) => b.length - a.length)[0] : null;
}

function extractConversationId(data) {
  const found = deepCollect(data, (k) => /conversation_?id/i.test(k));
  return found.length ? found[0] : null;
}

function formatError(res) {
  if (res.status === 422 && Array.isArray(res.data?.detail)) {
    return res.data.detail.map((d) => d.msg).join("; ");
  }
  return res.data?.message || res.data?.error || `Request failed (status ${res.status}).`;
}

async function callChat(userMessage, conversationId) {
  const body = { message: userMessage, timeout: 60 };
  if (conversationId) {
    body.conversation_id = conversationId;
    body.new_conversation = false;
  } else {
    body.new_conversation = true;
  }
  return axios.post(`${BASE_URL}/v1/chat`, body, { timeout: 65000, validateStatus: () => true });
}

function registerReplyChain(info, threadID, senderID, conversationId) {
  if (!info) return;
  global.GoatBot.onReply.set(info.messageID, {
    commandName: "ai",
    author: senderID,
    conversationId
  });
}

module.exports = {
  config: {
    name: "ai",
    aliases: ["chat", "gpt"],
    version: "1.1",
    author: "Neoaz 🐊",
    countDown: 3,
    role: 0,
    shortDescription: { en: "Chat with AI" },
    longDescription: { en: "Chat with AI. Reply to the bot's response to continue the conversation. Use '{pn} new' to start fresh." },
    category: "ai",
    guide: { en: "{pn} <message>\n{pn} new\n(reply to a response to continue it)" }
  },

  onStart: async function ({ message, args, event }) {
    if ((args[0] || "").toLowerCase() === "new") {
      delete conversations[event.threadID];
      saveConversations();
      return message.reply("Started a new conversation.");
    }

    const userMessage = args.join(" ");
    if (!userMessage) return message.reply("Usage: {pn} <message> | {pn} new");

    const existingConvId = conversations[event.threadID];

    try {
      const res = await callChat(userMessage, existingConvId);

      if (res.status >= 400) {
        return message.reply(formatError(res));
      }

      const replyText = extractReplyText(res.data);
      const newConvId = extractConversationId(res.data) || existingConvId;
      if (newConvId) {
        conversations[event.threadID] = newConvId;
        saveConversations();
      }

      message.reply(replyText || "No response text could be found in the API's reply.", (err, info) => {
        registerReplyChain(info, event.threadID, event.senderID, newConvId);
      });
    } catch (e) {
      console.error("[AI COMMAND ERROR]:", e?.response?.data || e.message || e);
      message.reply("An error occurred while contacting the AI.");
    }
  },

  onReply: async function ({ message, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const userMessage = event.body;
    if (!userMessage) return;

    try {
      const res = await callChat(userMessage, Reply.conversationId);

      if (res.status >= 400) {
        return message.reply(formatError(res));
      }

      const replyText = extractReplyText(res.data);
      const newConvId = extractConversationId(res.data) || Reply.conversationId;
      if (newConvId) {
        conversations[event.threadID] = newConvId;
        saveConversations();
      }

      message.reply(replyText || "No response text could be found in the API's reply.", (err, info) => {
        registerReplyChain(info, event.threadID, event.senderID, newConvId);
      });
    } catch (e) {
      console.error("[AI COMMAND ERROR]:", e?.response?.data || e.message || e);
      message.reply("An error occurred while contacting the AI.");
    }
  }
};
