const axios = require('axios');

module.exports = {
  config: {
    name: 'nglspam',
    aliases: ['ngl', 'spam'],
    version: '1.0.2',
    author: 'tukmol',
    role: 0,
    shortDescription: {
      en: 'NGL Spammer Command'
    },
    longDescription: {
      en: 'Sends a specified message multiple times to a given username using NGL API.'
    },
    category: 'utility',
    guide: {
      en: 'Format 1: {p}nglspam <username> <amount> <message>\n' +
          'Format 2: {p}nglspam <username> | <amount> | <message>\n' +
          'Example 1: nglspam johndoe 5 hello world\n' +
          'Example 2: nglspam johndoe | 5 | hello world'
    },
    cooldown: 3,
  },
  
  onStart: async function ({ api, event, args }) {
    let username, amount, message;
    
    // Check if using pipe separator
    const fullCommand = args.join(' ');
    if (fullCommand.includes('|')) {
      // Parse pipe-separated format
      const parts = fullCommand.split('|').map(part => part.trim());
      
      if (parts.length < 3) {
        return api.sendMessage(
          '❌ Invalid pipe format!\n' +
          'Usage: nglspam <username> | <amount> | <message>\n' +
          'Example: nglspam johndoe | 5 | hello world',
          event.threadID,
          event.messageID
        );
      }
      
      username = parts[0];
      amount = parseInt(parts[1], 10);
      message = parts.slice(2).join(' | '); // Rejoin in case message contains pipes
    } else {
      // Parse space-separated format
      if (args.length < 3) {
        return api.sendMessage(
          '❌ Invalid usage!\n' +
          'Format 1: {p}nglspam <username> <amount> <message>\n' +
          'Format 2: {p}nglspam <username> | <amount> | <message>\n' +
          'Example 1: nglspam johndoe 5 hello world\n' +
          'Example 2: nglspam johndoe | 5 | hello world',
          event.threadID,
          event.messageID
        );
      }

      username = args[0];
      amount = parseInt(args[1]);
      message = args.slice(2).join(' ');
    }

    // Validate username
    if (!username || username.length === 0) {
      return api.sendMessage('❌ Username cannot be empty.', event.threadID, event.messageID);
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage('❌ Amount must be a positive number.', event.threadID, event.messageID);
    }

    if (amount > 100) {
      return api.sendMessage('❌ Maximum number of requests is 100.', event.threadID, event.messageID);
    }

    // Validate message
    if (!message || message.length === 0) {
      return api.sendMessage('❌ Message cannot be empty.', event.threadID, event.messageID);
    }

    if (message.length > 1000) {
      return api.sendMessage('❌ Message is too long. Maximum 1000 characters.', event.threadID, event.messageID);
    }

    const processingMsg = await api.sendMessage(
      ⚙️ Processing request to send ${amount} message(s) to @${username}...\n +
      Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}",
      event.threadID
    );

    const headers = {
      referer: https://ngl.link/${username},
      "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
    };

    const postData = {
      username,
      question: message,
      deviceId: "ea356443-ab18-4a49-b590-bd8f96b994ee",
      gameSlug: "",
      referrer: ""
    };

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < amount; i++) {
        try {
          await axios.post("https://ngl.link/api/submit", postData, { headers });
          successCount++;
          console.log(Message ${i + 1} sent to ${username});
          
          if ((i + 1) % 5 === 0 || i === amount - 1) {
            api.sendMessage(
              📨 Progress: ${i + 1}/${amount} messages sent...,
              event.threadID,
              event.messageID
            );
          }
        } catch (error) {
          errorCount++;
          console.error(Error sending message ${i + 1}:, error.message);
        }
        
        if (i < amount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const resultMessage = 
        ✅ Successfully sent ${successCount}/${amount} messages to @${username}.\n +
        (errorCount > 0 ? ⚠️ Failed to send ${errorCount} message(s). : '');

      api.sendMessage(resultMessage, event.threadID, event.messageID);
      
    } catch (error) {
      console.error("Fatal error in sending messages:", error);
      api.sendMessage(
        '❌ An error occurred while sending messages.\n' +
        'Please try again later.',
        event.threadID,
        event.messageID
      );
    }
  }
};
