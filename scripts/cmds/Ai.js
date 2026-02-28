const axios = require('axios');
const API_ENDPOINT = 'https://metakexbyneokex.fly.dev/chat';

module.exports = {
  config: {
    name: "ai",
    version: "1",
    role: 0,
    author: "Neoaz 🐦",
    description: "Chat with Meta Ai",
    category: "AI",
    usages: "[message] or reply to the bot's message.",
    cooldowns: 5
  },

  onStart: async function({ message, args, event }) {
    const userMessage = args.join(" ");

    if (!userMessage) {
      return message.reply("Please provide a message to start chatting with the AI.");
    }

    const senderID = event.senderID;
    const sessionID = `chat-${senderID}`;

    try {
      const fullResponse = await axios.post(API_ENDPOINT, { 
          message: userMessage, 
          new_conversation: true, 
          cookies: {} 
      }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000 
      });
      
      const aiMessage = fullResponse.data.message;

      if (typeof aiMessage === 'string' && aiMessage.trim().length > 0) {
          await message.reply(aiMessage, (err, info) => {
              if (info) {
                  global.GoatBot.onReply.set(info.messageID, {
                      commandName: this.config.name,
                      author: senderID,
                      messageID: info.messageID,
                      sessionID: sessionID 
                  });
              }
          });
      } else {
          await message.reply("AI responded successfully, but the message was empty. Please try again.");
      }

    } catch (error) {
      let errorMsg = "An unknown error occurred while contacting the AI.";
      
      if (error.response) {
          errorMsg = `API Error: Status ${error.response.status}. The server may be unavailable.`;
      } else if (error.code === 'ECONNABORTED') {
          errorMsg = "Request timed out. The AI took too long to respond.";
      }

      await message.reply(`❌ AI Command Failed\n\nError: ${errorMsg}`);
    }
  },

  onReply: async function ({ message, event, Reply }) {
    const userID = event.senderID;
    const query = event.body?.trim();
    
    if (userID !== Reply.author || !query) return;

    global.GoatBot.onReply.delete(Reply.messageID);

    const sessionID = Reply.sessionID || `chat-${userID}`;

    try {
      const fullResponse = await axios.post(API_ENDPOINT, { 
          message: query, 
          new_conversation: false, 
          cookies: {} 
      }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000 
      });
      
      const aiMessage = fullResponse.data.message;

      if (typeof aiMessage === 'string' && aiMessage.trim().length > 0) {
          await message.reply(aiMessage, (err, info) => {
              if (info) {
                  global.GoatBot.onReply.set(info.messageID, {
                      commandName: this.config.name,
                      author: userID,
                      messageID: info.messageID,
                      sessionID: sessionID 
                  });
              }
          });
      } else {
          await message.reply("AI responded successfully, but the message was empty. Please try again.");
      }

    } catch (error) {
      let errorMsg = "An unknown error occurred while contacting the AI.";
      
      if (error.response) {
          errorMsg = `API Error: Status ${error.response.status}. The server may be unavailable.`;
      } else if (error.code === 'ECONNABORTED') {
          errorMsg = "Request timed out. The AI took too long to respond.";
      }

      await message.reply(`❌ AI Command Failed\n\nError: ${errorMsg}`);
    }
  }
};
