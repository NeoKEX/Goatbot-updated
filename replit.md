# Goat Bot V2

## Overview

Goat Bot V2 is a Facebook Messenger chatbot built on Node.js that uses an unofficial Facebook Chat API to automate interactions on Messenger. The bot provides a command-based system with plugin architecture, event handling, and a web dashboard for configuration management. It supports multiple database backends (JSON, SQLite, MongoDB) and includes features like multi-language support, Google Drive integration, and automated uptime monitoring.

**Key Features:**
- Command and event-based bot framework
- Web dashboard for bot configuration
- Multi-database support (JSON/SQLite/MongoDB)
- Google Drive file management
- Email notifications via Gmail
- Real-time MQTT messaging
- Multi-language support

## Recent Changes

### November 8, 2025
- **Docker Deployment Optimization for Render/Railway**: Fixed Canvas card generation on production deployments and reduced build time by 60-80%
  - Switched from Debian-slim to Alpine Linux base image (80% smaller image size)
  - Fixed all Canvas native dependencies for both build and runtime stages
  - Added `.dockerignore` file to exclude unnecessary files from Docker builds
  - Build stage dependencies: build-base, cairo-dev, pango-dev, giflib-dev, pixman-dev, pkgconf, python3, sqlite-dev
  - Runtime dependencies: cairo, pango, giflib, pixman, libjpeg-turbo, freetype, fontconfig, sqlite-libs, util-linux-libs (for libuuid)
  - Updated render.yaml with BuildKit optimization and health check configuration
  - Updated railway.json with health check path and timeout settings
  - Installed Replit system dependencies: cairo, pango, libuuid, libjpeg, giflib, pixman, fontconfig
  - Canvas card generation now works properly on all platforms (Replit, Render, Railway)
  - Build time reduced from ~48 seconds to ~10-15 seconds on subsequent builds
  - Location: `Dockerfile`, `.dockerignore`, `render.yaml`, `railway.json`

### November 7, 2025
- **Fixed YouTube Download Command (ytb)**: Resolved broken YouTube video/audio download functionality
  - Replaced `ytdlp-nodejs` with `@distube/ytdl-core` library
  - Updated `@distube/ytdl-core` to latest version to fix 403 errors and format parsing issues
  - Rewrote format selection logic to manually filter and select formats instead of using buggy `chooseFormat` function
  - Video downloads: Manually filter formats with both audio and video, select highest quality by qualityLabel
  - Audio downloads: Manually filter audio-only formats, select highest bitrate
  - Fixed "No such format found: highestaudio" error with proper format filtering
  - Dynamic container format detection for both video (mp4, webm) and audio (m4a, webm, mp4)
  - Improved error handling with proper cleanup guards
  - Better error messages showing actual failure reasons
  - Location: `scripts/cmds/ytb.js`
  - Version bumped from 2.0 to 2.2
- **New Shell Command**: Added command to execute shell/terminal commands
  - Command name: `shell`
  - Author: NeoKEX
  - Bot admin only (role: 2) for security
  - Allows executing any shell command with 60-second timeout
  - Returns raw command output or error messages (no labels/formatting)
  - Automatically truncates long output to prevent message flooding
  - Location: `scripts/cmds/shell.js`
  - Version: 1.0
- **Premium User Role (Role 3)**: Enhanced role system to support premium users
  - Added role 3 for premium users configured in `config.json` under `premiumUsers` array
  - Premium users are identified by their user ID in the `premiumUsers` array (similar to `adminBot`)
  - Premium users can now use role 3 commands (role: 3)
  - Bot admins (role 2) can use ALL commands including role 3 commands
  - Permission check logic updated in `bot/handler/handlerEvents.js` for all event types (onStart, onChat, onReply, onReaction)
  - Added premium user error messages to language files (`languages/en.lang` and `languages/vi.lang`)
  - Error messages: `onlyPremiumUser`, `onlyPremiumUserToUseOnReply`, `onlyPremiumUserToUseOnReaction`
- **Improved Prefix Command**: Enhanced the prefix command response
  - When users type "prefix", bot now shows a personalized greeting with user name
  - Displays both global and chat-specific prefix
  - Shows bot name from config
  - Format: "👋 Hey [Name], did you ask for my prefix?\n➥ 🌐 Global: [prefix]\n➥ 💬 This Chat: [prefix]\nI'm [BotName], nice to meet you!"
- **Unsend on Reaction Feature**: Fixed critical bugs preventing the feature from working
  - Fixed command lookup bug in `bot/handler/handlerEvents.js` where onAnyEvent handlers weren't being called due to case-sensitive Map key lookup (commands stored as lowercase but retrieved with original case)
  - Fixed type mismatch in admin ID comparison in `scripts/cmds/unsendReaction.js` by ensuring both adminBot IDs and reactorID are converted to strings before comparison
  - Location: `scripts/cmds/unsendReaction.js` (implemented as command with `onAnyEvent` handler)
  - Feature: Bot admins can react with 😠 or 😡 emojis to unsend bot messages
  - Only bot admins (configured in `adminBot` array) can trigger this feature
  - Works exclusively on messages sent by the bot
  - Provides console feedback with debug logging for troubleshooting
- **Command Suggestions Feature**: Added intelligent command suggestion system
  - When a user types an incorrect command, the bot suggests the closest matching commands using Levenshtein distance algorithm
  - Suggests up to 3 similar commands with edit distance <= 3
  - When a user types only the prefix, the bot now displays a helpful message telling them to type `prefix + help` to see all available commands
  - Location: `bot/handler/handlerEvents.js` (added `levenshteinDistance` and `findSimilarCommands` functions)
  - Language strings added to `languages/en.lang`
- **Node.js Upgrade**: Upgraded from Node.js v20.19.3 to v24.4.0 (latest version)
- **Fixed neokex-fca Integration**: 
  - Fixed import statement to properly destructure login function from neokex-fca
  - Corrected login parameters to pass appState directly instead of wrapped in object
  - Bypassed pre-validation cookie check to let neokex-fca handle authentication with forceLogin option
- **System Dependencies**: Added libuuid library for canvas package support
- **Code Quality**: Fixed octal escape sequences to use hex format (\x1b instead of \033)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Authentication & Session Management

**Problem**: Facebook requires persistent authentication using cookies and session state for chatbot operations.

**Solution**: Uses `neokex-fca` (Facebook Chat API wrapper) with cookie-based authentication. Supports multiple login methods including email/password, 2FA with TOTP, and cookie refresh mechanisms. Session state is stored as `appState` JSON for persistence across restarts.

**Key Components:**
- Cookie-based authentication with automatic refresh
- Support for proxy connections
- Session validation before connection
- Multiple login methods (email/password, mbasic, token-based)

**Trade-offs**: 
- Pros: Persistent sessions, automatic recovery
- Cons: Risk of account blocks, requires careful rate limiting

### Database Layer

**Problem**: Need flexible data storage that works across different deployment environments (local, VPS, cloud).

**Solution**: Abstracted database layer supporting three backends via configuration:
- **JSON**: File-based storage for simple deployments
- **SQLite**: Embedded database with better performance
- **MongoDB**: Cloud-ready database for scalability

**Architecture Pattern**: Repository pattern with unified controller interface (`threadsData`, `usersData`, `dashBoardData`, `globalData`).

**Data Models:**
- `threadModel`: Chat thread/group data and settings
- `userModel`: User profiles and statistics
- `dashBoardModel`: Dashboard user accounts
- `globalModel`: Bot-wide configuration and shared data

**Trade-offs**:
- Pros: Deployment flexibility, easy migration between storage types
- Cons: Feature parity limitations across backends, potential performance variations

### Command & Event System

**Problem**: Need extensible plugin system for bot commands and event handlers.

**Solution**: Dynamic module loading from `scripts/cmds/` and `scripts/events/` directories. Each module exports a config object and handler functions.

**Command Structure:**
```javascript
module.exports = {
  config: {
    name: "commandName",
    role: 0, // 0: user, 1: group admin, 2: bot admin, 3: premium user
    // ... other config
  },
  onStart: async ({ api, event, args, message }) => {
    // Command logic
  }
}
```

**Role System:**
- **Role 0 (User)**: Regular users, no special permissions
- **Role 1 (Group Admin)**: Group administrators can use role 1 commands
- **Role 2 (Bot Admin)**: Bot admins configured in `adminBot` array in `config.json`, can use ALL commands (including role 3)
- **Role 3 (Premium User)**: Users configured in `premiumUsers` array in `config.json`, can use premium features
- Role assignment priority: Bot Admin (2) > Premium User (3) > Group Admin (1) > User (0)
- Bot admins can always use any command regardless of required role
- To add premium users, add their Facebook user ID to the `premiumUsers` array in `config.json`

**Event Structure:**
```javascript
module.exports = {
  config: {
    name: "eventName"
  },
  onStart: async ({ event, api }) => {
    // Event handling logic
  }
}
```

**Features:**
- Hot-reload support via file watchers
- Permission-based access control (user/admin/bot-admin)
- Command aliases system
- Environment-based configuration per command

**Trade-offs**:
- Pros: Highly extensible, easy to add features
- Cons: No sandboxing, commands have full system access

### Web Dashboard

**Problem**: Need user-friendly interface for bot configuration without editing JSON files.

**Solution**: Express.js web server with ETA templating, Passport.js authentication, and Socket.IO for real-time updates.

**Stack:**
- **Express.js**: Web framework
- **Passport.js**: Authentication (local strategy with bcrypt)
- **ETA**: Templating engine
- **Socket.IO**: Real-time communication
- **reCAPTCHA v2**: Bot protection

**Features:**
- Thread-specific configuration pages
- File upload for welcome/leave messages via Google Drive
- User authentication with email verification
- Rate limiting on API endpoints
- Session management with persistent cookies

**Security Measures:**
- bcrypt password hashing
- CSRF protection via reCAPTCHA
- Role-based access control per thread
- Rate limiting on sensitive endpoints

**Trade-offs**:
- Pros: User-friendly, no technical knowledge required
- Cons: Additional attack surface, requires HTTPS in production

### Message Handler Architecture

**Problem**: Process incoming Facebook messages through multiple layers (commands, events, replies, reactions).

**Solution**: Event-driven architecture with handler chain:

1. `handlerAction.js`: Main entry point, routes events by type
2. `handlerCheckData.js`: Ensures user/thread data exists in database
3. `handlerEvents.js`: Validates permissions, checks bans, routes to appropriate handlers

**Event Types Handled:**
- `message`: Standard text messages
- `message_reply`: Reply to previous messages
- `message_reaction`: Reactions to messages
- `event`: Facebook events (user join/leave, name change, etc.)
- `typ`: Typing indicators
- `presence`: Online/offline status

**Trade-offs**:
- Pros: Clean separation of concerns, easy to debug
- Cons: Multiple async layers can impact latency

## External Dependencies

### Facebook Chat API
- **neokex-fca**: Unofficial Facebook Chat API wrapper
- Handles MQTT connections for real-time messaging
- Provides message sending, reactions, thread management
- **Risk**: Unofficial API subject to Facebook changes

### Google Services
- **Google Drive API**: File storage for attachments (images, videos, audio)
- **Gmail API**: Email notifications and verification codes
- **OAuth 2.0**: Authentication flow for Google services
- **Required Credentials**: Client ID, Client Secret, Refresh Token

### Email Notifications
- **Nodemailer**: Email sending via Gmail SMTP
- Used for: Registration verification, password reset, error notifications
- Requires Gmail app-specific password or OAuth tokens

### Uptime Monitoring
- **Better Uptime** or **UptimeRobot**: External health checks
- Configured via `config.autoUptime.url`
- Prevents bot from sleeping on free hosting platforms (Replit, Glitch)

### Database Systems
- **MongoDB**: Cloud database via connection URI (optional)
- **SQLite**: Via `sqlite3` package with Sequelize ORM (optional)
- **JSON**: Native file system operations (default)

### Third-Party APIs
- **OpenWeatherMap**: Weather data (API key in `configCommands.json`)
- **iTunes Search**: App store searches
- **YouTube**: Video downloads via `@distube/ytdl-core`
- **TikTok**: Video downloads (custom scraping)

### Authentication & Security
- **Google reCAPTCHA v2**: Bot protection on login/register
- **bcrypt**: Password hashing for dashboard users
- **totp-generator**: Two-factor authentication support
- **Passport.js**: Session management and authentication

### Development Tools
- **jsonlint-mod**: Config file validation
- **ora**: Loading spinners
- **gradient-string**: Colored console output
- **Canvas**: Image generation for QR codes
- **cheerio**: HTML parsing for web scraping

### Deployment Notes
- Designed for Replit deployment (see `STEP_INSTALL.md`)
- Supports proxy configurations for restricted networks
- Environment-based config files (`config.json` vs `config.dev.json`)
- Automatic cookie refresh to maintain Facebook sessions