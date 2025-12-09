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

**Custom Library: neokex-fca**
- MQTT-based message listening for real-time events
- Automatic reconnection handling with configurable intervals
- Enhanced anti-detection features (see below)
- User/thread info caching
- Message sending with attachment support (images, videos, audio)
- Friend request handling
- Message editing and unsending

**Anti-Detection Enhancements** (node_modules/neokex-fca):
- **Context-Aware Rate Limiting**:
  - Stochastic delay envelopes with ±30% variance
  - Message type awareness (text, attachments, replies)
  - Burst detection (5+ messages in 10s → 2x delay)
  - Circadian rhythm simulation (3x slower 2-6 AM, normal 9-18)
  - Checkpoint-aware backoff mode (5x slower when detected)
  - Behavioral metrics tracking per thread
- **Smart Checkpoint Detection**:
  - URL-based (redirects to /checkpoint/, /login/)
  - Form-based (checkpoint form IDs, login forms)
  - Text-based (security check, session expired messages)
  - Error-based (checkpoint/session errors in responses)
  - Avoids false positives from normal logged-in pages
- **Automatic Session Recovery**:
  - Integration with existing AutoReLoginManager
  - Fresh login via loginHelper when cookies expire
  - Database cookie backup and restore
  - Retry logic with exponential backoff
  - Enables continuous bot operation until natural cookie expiry

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
- `fca-neokex`: Facebook Chat API client
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
- ⚠️ **Known Issue (November 25, 2025)**: btch-downloader returns YouTube URLs that trigger 403 Forbidden errors
  - Root cause: YouTube blocks unsigned/expired URLs from `googlevideo.com` redirector
  - URLs expire quickly or require specific authentication sessions
  - This is a YouTube protection mechanism, not a code bug
  - **Alternatives available**:
    - `@distube/ytdl-core` (already installed, actively maintained, supports cookies/proxy for 403 fixes)
    - `play-dl` (faster, no external dependencies)
    - `youtubei.js` (uses YouTube's internal InnerTube API, more stable)
  - Current implementation correctly uses btch-downloader API but downloads fail at YouTube's server level

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

**Facebook API Library Migration** (November 2025)
- ✅ **Migrated from @dongdev/fca-unofficial to neokex-fca**
- ✅ **Enhanced RateLimiter**: Context-aware delays, circadian rhythm, burst detection, checkpoint backoff
- ✅ **Smart TokenRefreshManager**: Specific checkpoint detection, auto-relogin integration
- ✅ **Automatic Session Recovery**: Integrated with AutoReLoginManager for fresh login on cookie expiry
- ✅ **Anti-Detection Features**: Human-like behavioral patterns to prevent Facebook bot detection
- 📍 **Important**: All modifications made in `node_modules/neokex-fca/` only (not bot directory)

### December 2025 - Whitelist & Permission Fixes

**Whitelist Mode Fix** (bot/login/login.js)
- ✅ **Fixed whitelist bypass issue**: Bot was responding to non-whitelisted users when whitelist mode was enabled
- ✅ **Added devUsers bypass**: Developers (role 4) now properly bypass whitelist restrictions like admins
- ✅ **String normalization**: All user/thread IDs are now converted to strings for consistent comparison
- ✅ **Cleaner logic**: Simplified whitelist check with clear variable names and proper handling of all three cases:
  - Both user and thread whitelist enabled
  - Only user whitelist enabled
  - Only thread whitelist enabled

**Dev Command** (scripts/cmds/dev.js)
- ✅ **Developer management**: Add/remove/list bot developers (role 4)
- ✅ **Same pattern as admin command**: Uses `config.devUsers` array in config.json
- ✅ **Role 4 required**: Only existing developers can add/remove other developers

**Gone Command Fix** (scripts/cmds/gone.js)
- ✅ **Added User-Agent header**: Some image hosts block requests without proper headers
- ✅ **Added timeout**: 30-second timeout prevents hanging on slow hosts
- ✅ **Improved cleanup**: Temp file is properly removed via callback after sending
- ✅ **Better error handling**: Errors are logged with context for debugging

**Security Hardening** (December 2025)
- ✅ **Dangerous commands restricted to role 4 (developer-only)**:
  - eval.js, restart.js, file.js, backupdata.js, loadconfig.js, update.js
  - Prevents non-developers from executing system commands
- ✅ **Path traversal protection**: file.js now validates command names and ensures paths stay within allowed directory
- ✅ **Socket verifyToken fix**: Added secure 32-byte hex token to config.json for dashboard socket authentication
- ✅ **Developer command renamed**: dev.js → developer.js to bypass production-mode exclusion of *dev.js files
- ✅ **Config helper utility**: Created func/configHelper.js with debounced writes, backup creation, and validation
- ✅ **Gitignore added**: Protects sensitive files (account.txt, appstate.json, database files) from version control