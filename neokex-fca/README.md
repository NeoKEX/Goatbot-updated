# NeoKEX-FCA

Advanced Facebook Chat API library for Node.js. Build powerful Messenger bots with real-time messaging, comprehensive features, and enterprise-grade reliability.

---

## ✨ Features

### Core Messaging
- 📨 **Real-time Messaging** - Send and receive messages instantly via MQTT
- 📎 **Rich Attachments** - Support for images, videos, audio, files, and stickers
- ✏️ **Message Editing** - Edit sent messages in real-time
- 💬 **Reactions** - Add and remove message reactions
- 🔔 **Typing Indicators** - Send and receive typing status
- 📍 **Location Sharing** - Share location data in messages
- 👥 **Mentions** - Tag users in messages

### Thread Management
- 📋 **Thread Info** - Get detailed information about conversations
- 📜 **Message History** - Retrieve conversation history
- 📌 **Pin Messages** - Pin important messages in threads
- 🎨 **Customization** - Change thread names, emojis, and themes
- 👑 **Admin Controls** - Manage group members and admins
- 🔕 **Mute/Unmute** - Control thread notifications

### Advanced Features
- 🔌 **Plugin System** - Extend functionality with custom plugins
- 🪝 **Webhooks** - Forward events to external endpoints
- 📊 **Advanced Logging** - Configurable logging with file output
- 🛡️ **Error Handling** - Comprehensive error classes and diagnostics
- 🔄 **Smart Auto-Recovery** - Intelligent reconnection with exponential backoff
- ✅ **Session Validation** - Validate credentials before connecting
- 🌐 **Proxy Support** - Full HTTP/HTTPS proxy support

### Performance & Reliability (v2.0.0 Enhancements)
- ⚡ **Performance Optimizer** - Built-in caching and request optimization
- 🔗 **Connection Manager** - Advanced health monitoring and stability
- 💾 **Smart Caching** - Reduce API calls with intelligent data caching
- 🎯 **Request Debouncing** - Prevent duplicate operations
- 📊 **Performance Metrics** - Track connection health and statistics
- 🔄 **Exponential Backoff** - Smart reconnection strategy prevents overwhelming servers

### Social Features
- 👤 **User Info** - Get detailed user profiles
- 📱 **Stories** - Reply to and react to stories
- 💬 **Comments** - Comment on posts
- 🔗 **Share** - Share content to timeline
- 👥 **Friends** - Send and manage friend requests
- ➕ **Follow/Unfollow** - Manage following relationships

---

## 📦 Installation

```bash
npm install neokex-fca
```

**Requirements:** Node.js >= 18.x

---

## 🚀 Quick Start

### 1. Get Your Credentials

You need Facebook session cookies to authenticate. Export your cookies using a browser extension like "EditThisCookie" or "Cookie-Editor" after logging into Facebook.

Save them as `appstate.json`:

```json
[
  {
    "key": "c_user",
    "value": "your_user_id"
  },
  {
    "key": "xs",
    "value": "your_session_token"
  }
]
```

### 2. Basic Bot Example

```javascript
const fs = require('fs');
const { login } = require('neokex-fca');

const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));

login({ appState }, {
  online: true,
  selfListen: false,
  listenEvents: true,
  autoMarkRead: true
}, (err, api) => {
  if (err) {
    console.error('Login failed:', err);
    return;
  }

  console.log('✅ Logged in successfully!');

  api.listenMqtt((err, event) => {
    if (err) return console.error(err);
    
    if (event.type === 'message' && event.body) {
      console.log(`Message from ${event.senderID}: ${event.body}`);
      
      if (event.body === '/ping') {
        api.sendMessage('🏓 Pong!', event.threadID);
      }
    }
  });
});
```

---

## 📚 Advanced Usage

### Using Webhooks

```javascript
login({ appState }, {
  webhook: {
    enabled: true,
    url: 'https://your-server.com/webhook',
    events: ['message', 'event'],
    secret: 'your-secret-key'
  }
}, (err, api) => {
  // All events will be forwarded to your webhook URL
});
```

### Custom Logging

```javascript
const { login, Logger } = require('neokex-fca');

const logger = new Logger({
  level: 'debug',
  enableFile: true,
  logFilePath: './bot.log',
  colorize: true
});

login({ appState }, { logger }, (err, api) => {
  // Your bot with custom logging
});
```

### Using Plugins

```javascript
// Create a custom plugin
const myPlugin = {
  name: 'command-handler',
  init() {
    this.commands = new Map();
  },
  addCommand(name, handler) {
    this.commands.set(name, handler);
  },
  async execute(message) {
    const [cmd, ...args] = message.body.split(' ');
    const handler = this.commands.get(cmd);
    if (handler) await handler(args);
  }
};

login({ appState }, (err, api) => {
  api.plugins.register('commands', myPlugin);
  
  myPlugin.addCommand('/help', () => {
    api.sendMessage('Available commands: /help, /ping', event.threadID);
  });
});
```

### Middleware System

```javascript
login({ appState }, (err, api) => {
  // Add middleware to process events
  api.plugins.use(async (event, context) => {
    // Filter spam
    if (event.body && event.body.includes('spam')) {
      return false; // Stop processing
    }
    
    // Add metadata
    event.processedAt = Date.now();
    return event; // Continue with modified event
  });

  api.listenMqtt((err, event) => {
    // Event has been processed by middleware
    console.log(event);
  });
});
```

---

## 📖 API Reference

### Main Methods

#### `sendMessage(message, threadID, [replyTo])`
Send a message to a thread.

```javascript
// Simple text
api.sendMessage('Hello!', threadID);

// With attachments
api.sendMessage({
  body: 'Check this out!',
  attachment: fs.createReadStream('./image.jpg')
}, threadID);

// With mentions
api.sendMessage({
  body: '@User check this',
  mentions: [{
    tag: '@User',
    id: userID
  }]
}, threadID);
```

#### `listenMqtt(callback)`
Listen for real-time events.

```javascript
api.listenMqtt((err, event) => {
  if (event.type === 'message') {
    // Handle message
  }
});
```

#### `getThreadInfo(threadID, callback)`
Get information about a thread.

```javascript
api.getThreadInfo(threadID, (err, info) => {
  console.log(info.threadName);
  console.log(info.participantIDs);
});
```

#### `getUserInfo(userID, callback)`
Get user profile information.

```javascript
api.getUserInfo(userID, (err, user) => {
  console.log(user.name);
  console.log(user.profileUrl);
});
```

---

## 🔧 Configuration Options

```javascript
{
  // Connection
  online: true,              // Show online status
  selfListen: false,         // Receive own messages
  listenEvents: true,        // Listen to all events
  autoMarkRead: true,        // Auto-mark messages as read
  autoReconnect: true,       // Auto-reconnect on disconnect
  
  // Logging
  logger: customLogger,      // Custom logger instance
  
  // Webhooks
  webhook: {
    enabled: true,
    url: 'https://...',
    events: ['message'],
    secret: 'key'
  },
  
  // Network
  proxy: 'http://proxy:port',
  userAgent: 'Custom UA'
}
```

---

## 🛠️ Error Handling

```javascript
const { AuthenticationError, NetworkError } = require('neokex-fca');

try {
  // Your code
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.log('Invalid credentials');
  } else if (err instanceof NetworkError) {
    console.log('Connection issue');
  }
  
  console.log(err.toJSON()); // Detailed error info
}
```

---

## 📋 Examples

Check the `examples/` directory for complete working examples:
- Basic bot
- Command handler
- Webhook integration
- Plugin system
- Advanced features

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👨‍💻 Author

**NeoKEX**  
- GitHub: [@NeoKEX](https://github.com/NeoKEX)
- Repository: [neokex-fca](https://github.com/NeoKEX/neokex-fca)

---

## 🙏 Credits

Inspired by **ws3-fca**

---

## ⭐ Support

If you find this library helpful, please give it a star on GitHub!

---

Copyright © 2025 NeoKEX. Licensed under MIT.
