# Goat Bot V2 - Facebook Messenger Bot

## Overview

Goat Bot V2 is a Facebook Messenger chatbot framework built on Node.js that enables automated interactions through Facebook's messaging platform. Originally created by NTKhang and enhanced by NeoKEX, the bot provides a plugin-based command system, user/thread data management, role-based permissions, and a web dashboard for configuration. The bot uses unofficial Facebook Chat API integration to operate without requiring Google API credentials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Application Structure

**Modular Plugin System**
- Commands stored in `scripts/cmds/` directory with hot-reload support
- Event handlers in `scripts/events/` for message lifecycle management
- Dynamic command loading at startup with dependency checking
- Plugin configuration isolated in `configCommands.json`

**Authentication & Session Management**
- Facebook authentication via cookies stored in `account.txt` and `appstate.json`
- Multiple login methods: cookie-based, email/password, and mbasic fallback
- 2FA support with TOTP generation
- Automatic cookie refresh on configurable intervals
- Session persistence across bot restarts

**Role-Based Permission System**
- 5-tier hierarchy: User (0) → Group Admin (1) → Bot Admin (2) → Premium (3) → Developer (4)
- **Developers (role 4)**: Most powerful role with full bot access, including exclusive message unsend permissions
- Per-command role requirements with money-based gating
- Premium features unlocked via user balance checks
- Developer commands include shell execution and eval for debugging
- **Time-Based Premium Access**: Premium users (role 3) can have time-limited access with automatic expiration
  - Configurable durations: days (7d), hours (2h), minutes (30m), or permanent
  - Expiration checked at role determination for immediate enforcement
  - Batched cleanup prevents excessive config file writes
  - Stored in `user.data.premiumExpireTime` field
- **Developer Message Control**: Developers can unsend any bot message using 😡 or 😠 reactions

**Data Storage Layer**
- Multi-database support: JSON, SQLite, or MongoDB
- Unified data controller abstraction in `database/controller/`
- Separate models for threads, users, dashboard, and global data
- Auto-sync capability to refresh thread/user information from Facebook
- SQLite as default with Sequelize ORM

**Message Handling Pipeline**
1. Event received via MQTT listener (fb-chat-api)
2. Database validation ensures thread/user records exist
3. Permission checks (role, money, banned status, spam detection)
4. Command parsing with prefix matching and alias resolution
5. Execution with context injection (api, event, args, etc.)
6. Reply/reaction handling for follow-up interactions

**Spam Protection System**
- **Spamban Command**: Temporary bans with customizable duration (default 2h)
  - Manual banning via @tag, UID, or reply with duration (e.g., `spamban @user 3h`)
  - Automatic unbanning when duration expires
  - List banned users with expiration times
- **Auto-Detection** (Optional, disabled by default):
  - Configurable thresholds (default: 5 messages in 10 seconds)
  - Automatic 2-hour ban when threshold exceeded
  - Per-thread toggle via `spamban autoban on/off`
  - Memory-efficient tracking with automatic cleanup

### Web Dashboard

**Express-Based Admin Interface**
- Port 3001 (configurable) with session-based authentication
- Passport.js for local authentication strategy
- Dashboard accounts stored separately from bot users
- Per-thread configuration pages for commands
- File upload via Google Drive integration for welcome/leave attachments
- Real-time command enable/disable toggles

**Security Features**
- BCrypt password hashing
- reCAPTCHA v2 verification on sensitive forms
- Rate limiting on API endpoints
- CSRF protection via express-session
- Email verification for account creation and password reset

**Template Rendering**
- ETA template engine for server-side rendering
- Bootstrap 5 + Phoenix CSS framework
- Socket.io for real-time uptime monitoring
- Toast notifications for user feedback

### Facebook API Integration

**Custom Fork: @dongdev/fca-unofficial**
- MQTT-based message listening for real-time events
- Automatic reconnection handling with configurable intervals
- Checkpoint detection and recovery
- User/thread info caching
- Message sending with attachment support (images, videos, audio)
- Friend request handling
- Message editing and unsending

**Cookie Management**
- Persistent cookie storage in JSON format
- Live cookie validation before bot startup
- Checkpoint detection with helpful error messages
- Proxy support for network routing

### Update Mechanism

**Version Control System**
- Remote version checking against GitHub repository
- File-level diff comparison using `versions.json` manifest
- Automatic backup creation before updates
- Selective file updates with user confirmation
- Rollback support via `restoreBackup.js`

### Deployment Configuration

**Multi-Platform Support**
- Railway: Pre-configured via `railway.json`
- Render: Deployment guide in `DEPLOY.md`
- Replit: Browser-based setup documented in `STEP_INSTALL.md`
- VPS: Standard Node.js deployment

**Process Management**
- Parent process (`index.js`) spawns child (`Goat.js`)
- Auto-restart on exit code 2
- Graceful error handling with custom handlers
- Timezone configuration (default: Asia/Ho_Chi_Minh)

## External Dependencies

### Third-Party Services

**Google Drive API** (Optional)
- File storage for dashboard attachments
- OAuth2 authentication for drive access
- Used for welcome/leave message media

**Email Service** (Dashboard Only)
- SMTP via Nodemailer for verification codes
- Account recovery and registration flows
- Configurable mail transport

**Uptime Monitoring** (Optional)
- BetterStack or UptimeRobot integration
- HTTP endpoint `/uptime` for health checks
- Socket.io channel for real-time status

### Key NPM Packages

**Core Framework**
- `@dongdev/fca-unofficial`: Facebook Chat API client
- `express`: Web server for dashboard
- `socket.io`: WebSocket communication
- `passport` + `passport-local`: Authentication

**Database**
- `mongoose`: MongoDB ODM
- `sequelize` + `sqlite3`: SQL ORM and SQLite driver
- `fs-extra`: Enhanced file system operations

**Utilities**
- `axios`: HTTP client for external APIs
- `cheerio`: HTML parsing for web scraping
- `canvas`: Image manipulation
- `moment-timezone`: Timezone-aware date handling
- `bcrypt`: Password hashing
- `totp-generator`: 2FA code generation

**Media Processing**
- `btch-downloader`: YouTube audio/video downloads (replaced ytdl-core for better reliability)
- `qrcode-reader`: QR code scanning
- `form-data`: Multipart form handling

## Recent Changes

### November 2025 - NeoKEX Enhancements

**Enhanced YouTube Download System**
- Replaced `@distube/ytdl-core` with `btch-downloader` v6.0.22 for improved stability
- **ytb.js**: Video/audio downloads with search and quality selection
- **sing.js**: Instant audio-only downloads with reaction feedback (⏳ → ✅/❌)
- Both commands use btch-downloader's simple URL-based interface

**Time-Based Premium Users**
- Premium command now supports expiration dates (e.g., `premium add @user 7d`)
- Automatic role demotion when premium expires
- Batched config cleanup every 5 seconds to minimize I/O
- Modified `getRole()` in handlerEvents.js for immediate expiry enforcement

**Spam Ban System**
- New `spamban` command for temporary bans with customizable duration
- Auto-detection toggle (off by default) with configurable thresholds
- Automatic unbanning when duration expires
- Event handler tracks message bursts and auto-bans spammers
- Stored per-thread in `data.spamban`, `data.spamban_auto`, `data.spamban_config`

**Production Deployment Fixes**
- ✅ **Removed .dev file naming**: All environments (dev/prod/Railway/Render) now use `config.json`, `configCommands.json`, `account.txt`
- ✅ **Fixed Render deployment**: Changed to `type: background` (no healthcheck required for bot)
- ✅ **Fixed Railway deployment**: Removed healthcheck requirements from railway.json
- ✅ **Unified file paths**: Simplified Goat.js, dashboard/connectDB.js, dashboard/app.js to use consistent file paths
- ✅ **Bot now stable on all platforms**: Local, Railway, and Render deployments all working