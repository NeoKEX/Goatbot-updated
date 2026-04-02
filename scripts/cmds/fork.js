module.exports = {
  config: {
    name: "fork",
    aliases: ["repo", "source"],
    version: "1.0",
    author: "NeoKEX",
    countDown: 3,
    role: 0,
    longDescription: "Returns the link to the official, updated fork of the bot's repository.",
    category: "system",
    guide: { en: "{pn}" }
  },

  onStart: async function({ message }) {
    const text = "✓ | Here is the updated repository:\n\nhttps://github.com/NeoKEX/Goatbot-V2.git\n\n" +
                 "Changes:\n1. No Google Credentials needed\n2. Enhanced overall performance\n3. Now using @neoaz07/nkxfca(v1.0.9) [ Automatic log out issues Solved ]\n4. Working on all groups\n5. Id Ban Issue solved 90% and running for a long time\n\nNB: If you want to use @neoaz07/nkxfca please install by typing: npm i @neoaz07/nkxfca@latest\n\n" +
                 "Keep supporting^_^";
    
    message.reply(text);
  }
};
