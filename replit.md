# Goat Bot V2

## Overview

Goat Bot V2 is a Facebook Messenger chat bot built using the `neokex-fca` (unofficial Facebook API). It provides extensive command-based functionality for managing group chats, user interactions, and automated responses, operating through a personal Facebook account. The bot supports multiple storage backends (JSON, SQLite, MongoDB) and features a modular command/event system.

**Key Capabilities:**
- Multi-database support (JSON, SQLite, MongoDB)
- Modular command and event system for easy extensibility
- Group chat management, including admin controls and anti-spam features
- Economy system with virtual currency
- Media processing for avatar generation and image manipulation
- Auto-uptime monitoring for continuous operation
- Multi-language support (Vietnamese, English)
- Advanced AI theme generation and application
- Interactive Pinterest image search

## Recent Changes

### Anti-Detection Enhancements for neokex-fca (November 17, 2025)
- **Enhanced Facebook Automated Behavior Detection Avoidance:**
  - Modified `neokex-fca/src/utils/axios.js`: Added random jitter (0-200ms) to exponential backoff in requestWithRetry
  - Enhanced `neokex-fca/src/utils/rateLimiter.js`: Added humanized delays (200-600ms) between sequential actions to simulate human behavior
  - Improved `neokex-fca/src/utils/formatters.js`: Enhanced parseAndCheckLogin to detect auth failures (error codes 1357001, 1357004) and login blocks
  - Updated `neokex-fca/src/apis/listenMqtt.js`: 
    - Added random jitter to MQTT reconnection delays
    - Ensured MQTT WebSocket headers reuse cached User-Agent, sec-ch headers, and locale for consistency
  - Benefits: Reduces Facebook's ability to detect automated behavior by mimicking human timing patterns
  - Based on analysis of dongdev's fca-unofficial implementation

### Web Interface for Cloud Deployment (November 17, 2025)
- **Added Simple Web Interface:**
  - Created `server.js` with Express web server running on port 5000
  - Web interface displays bot status, version, uptime, and platform information
  - Real-time bot health tracking using `global.botStatus` object
  - Shows actual bot process status (running/stopped) and uptime
  - Displays error messages when bot crashes or exits abnormally
  - Three endpoints available:
    - `/` - Main status page with visual interface
    - `/health` - Health check endpoint for monitoring services
    - `/status` - JSON API endpoint with detailed bot status
  - Proper credits displayed: "Created by NTKhang, Enhanced by NeoKEX"
  - Integrated with `index.js` to run alongside the bot
  - Enables deployment on cloud platforms like Render and Railway
  - Workflow configured with webview output type on port 5000

### Message Simplification (November 16, 2025)
- **Simplified All Bot Responses:**
  - Replaced all emojis with simple characters: ✓ (success), × (error), ! (warning), > (info), * (special)
  - Shortened verbose phrases: "Successfully" → "", "has been" → "", "Please enter" → "Enter"
  - Simplified error messages: "An error occurred" → "Error"
  - Removed unnecessary words: "already", "currently", "in your group"
  - Updated all language files, command files, and handler messages
  - Messages are now more concise and easier to read

### Role Permission Updates (November 16, 2025)
- **Enhanced Role-Based Command Access:**
  - Modified `bot/handler/handlerEvents.js` to implement new role-based permission logic
  - **Bot Administrators (Role 2)** can now use commands with roles 0, 1, 2, and 3
  - **Bot Developers (Role 4)** can now use all commands (roles 0-4)
  - **Regular Users (Role 0)** can only use role 0 commands
  - **Group Administrators (Role 1)** can use roles 0 and 1 commands
  - **Premium Users (Role 3)** can use roles 0, 1, 2, and 3 commands
  - This change provides more granular control over command access based on user roles

### Bug Fixes (November 16, 2025)
- **Fixed Accept Command Compatibility with neokex-fca:**
  - Modified `node_modules/neokex-fca/src/apis/httpPost.js` to ensure consistent string responses
  - Added `normalizeBody` helper function that converts all response types to strings:
    - Handles null/undefined values with String() conversion
    - Converts Buffers/Uint8Array to UTF-8 strings
    - JSON.stringifies objects with safe fallback to String()
    - Returns strings unchanged
  - This ensures the accept command (and other commands using httpPost) work correctly with neokex-fca
  - Previously, neokex-fca returned objects directly while accept command expected strings for JSON.parse()
  - Now maintains compatibility with ws3-fca behavior while providing robust error handling

- **Fixed Pending Command for Searching Pending Users:**
  - Modified `node_modules/neokex-fca/src/apis/getThreadList.js` to handle null/undefined fields gracefully
  - Added safe null handling for fields that may be missing in pending user entries:
    - `adminIDs`: Defaults to empty array if thread_admins is null/undefined
    - `approvalQueue`: Defaults to empty array if group_approval_queue.nodes is null/undefined
    - `reactionsMuteMode`: Defaults to 'all_reactions' if null/undefined
    - `mentionsMuteMode`: Defaults to 'all_mentions' if null/undefined
  - This prevents "Cannot read properties of undefined (reading 'map')" errors when fetching pending users
  - Previously, neokex-fca crashed when trying to format pending user entries that lack group-specific fields
  - Now maintains compatibility with ws3-fca's behavior of returning empty arrays for missing fields

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Authentication & Login System
The bot uses `neokex-fca` for authentication, supporting cookie-based, email/password (with 2FA), token-based, and QR code logins. It includes automatic cookie refresh and checkpoint recovery handlers for security challenges. The system is designed with a fallback chain for robust authentication.

### Database Architecture
A flexible database abstraction layer supports JSON (file-based), SQLite (embedded), and MongoDB (NoSQL) storage. This allows for diverse deployment environments. A repository pattern with a unified interface (`usersData`, `threadsData`, `globalData`) abstracts the underlying storage, and a task queue serializes write operations.

### Command System
A plugin-based architecture allows for easy addition, update, or removal of commands. Commands are self-contained modules located in `scripts/cmds/`, each defining its configuration, multi-language support, and handlers (`onStart`, `onChat`, `onReply`, `onReaction`). Commands are hot-reloadable and support aliases.

### Event Handling System
An event-driven architecture processes various Facebook events (messages, reactions, member changes). `handlerEvents.js` routes events to appropriate handlers, and `handlerCheckData.js` ensures data integrity. Event modules in `scripts/events/` manage automated behaviors like welcome messages and auto-moderation.

### Permission & Access Control
A five-tier role system manages hierarchical permissions: Regular users (0), Group administrators (1), Bot administrators (2), Premium users (3), and Bot developers (4). The system features deterministic resolution, backward compatibility for data migration, cold start protection, role validation, and caching for performance.

**Role-Based Command Access:**
- **Regular Users (Role 0):** Can only use commands with role requirement 0
- **Group Administrators (Role 1):** Can use commands with roles 0 and 1
- **Bot Administrators (Role 2):** Can use commands with roles 0, 1, 2, and 3 (extended access)
- **Premium Users (Role 3):** Can use commands with roles 0, 1, 2, and 3
- **Bot Developers (Role 4):** Have unrestricted access to all commands (roles 0-4) and role management capabilities

### Auto-Uptime & Monitoring
An HTTP server endpoint at `/uptime` provides a health check for external monitoring services (e.g., UptimeRobot) to prevent the bot from sleeping on inactive platforms. Socket.IO can be integrated for real-time status monitoring.

### Multi-Language Support
A language file system (`languages/*.lang`) provides key-value translations for all user-facing strings, accessed via a `getLang()` function for consistent multi-language support.

## External Dependencies

### Core Dependencies
- **neokex-fca**: Unofficial Facebook Chat API
- **express**: Web server for endpoints
- **socket.io**: Real-time communication
- **googleapis**: Google Drive integration
- **nodemailer**: Email notifications

### Database Drivers
- **mongoose**: MongoDB ODM
- **sequelize**: SQL ORM
- **sqlite3**: SQLite driver
- **fs-extra**: File system operations for JSON mode

### Media & Processing
- **canvas**: Image manipulation
- **axios**: HTTP client
- **cheerio**: HTML parsing
- **qrcode-reader**: QR code processing

### Authentication & Security
- **bcrypt**: Password hashing
- **passport / passport-local**: Dashboard authentication
- **express-session**: Session management
- **totp-generator**: Two-factor authentication

### Utilities
- **moment-timezone**: Date/time handling
- **lodash**: Utility functions
- **gradient-string**: Console styling
- **ora**: Terminal spinners

### Third-Party Services (Optional)
- **Google Cloud Console**: For OAuth credentials
- **reCAPTCHA v2**: Bot protection
- **UptimeRobot / BetterStack**: External monitoring
- **MongoDB Atlas**: Cloud MongoDB hosting