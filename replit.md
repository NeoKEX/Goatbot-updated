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
A five-tier role system manages hierarchical permissions: Regular users (0), Group administrators (1), Bot administrators (2), Premium users (3), and Bot developers (4). The system features deterministic resolution, backward compatibility for data migration, cold start protection, role validation, and caching for performance. Developers (Role 4) have unrestricted access and role management capabilities.

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