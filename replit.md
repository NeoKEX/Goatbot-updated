# Goat Bot V2

## Overview

Goat Bot V2 is a Facebook Messenger chat bot built using neokex-fca (unofficial Facebook API). It operates using a personal Facebook account and provides extensive command-based functionality for managing group chats, user interactions, and automated responses. The bot supports multiple storage backends (JSON, SQLite, MongoDB) and features a modular command/event system.

**Key Features:**
- Multi-database support (JSON, SQLite, MongoDB)
- Modular command and event system
- Group chat management (admin controls, anti-spam, auto-moderation)
- Economy system (virtual currency, daily rewards)
- Media processing (avatar generation, image manipulation)
- Auto-uptime monitoring with external services
- Multi-language support (Vietnamese, English)

**Recent Changes (November 2025):**
- Migrated from local fb-chat-api to neokex-fca npm package
- Removed entire dashboard system to simplify deployment
- Cleaned up database models and global state
- **Critical Security Fix:** Refactored role storage and resolution system with:
  - Proper promise handling and validation
  - Backward-compatible data migration for legacy role fields
  - Cold start protection to prevent role downgrade during initialization
  - Role caching to reduce database load
  - Comprehensive error logging instead of silent failures
- **Bug Fixes (November 15, 2025):**
  - Fixed welcome event error by updating function call to `api.nickname` (correct neokex-fca module name)
  - Fixed accept command error by adding proper error handling and using `api.sendMessage` instead of undefined message object
  - Added validation for GraphQL response structure in accept command to prevent "Cannot read properties of undefined" errors
- **New Features (November 15, 2025):**
  - **Advanced AI Theme System**: Complete theme generation and management system
    - Generates 5 AI-powered theme variations per request
    - Interactive preview with theme IDs and color information
    - Reply-based selection system (users reply with 1-5 to choose)
    - Direct theme application by ID: `?theme apply <ID>`
    - Displays gradient colors, accessibility labels, and color descriptions
  - **neokex-fca Enhancements**:
    - Modified `createAITheme` API to support generating 1-10 themes (default: 3)
    - Backward compatible implementation with parameter validation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Authentication & Login System
**Problem:** Securely authenticate with Facebook using personal accounts while handling various login methods and security challenges.

**Solution:** Multi-method login system using neokex-fca supporting:
- Cookie-based authentication (primary method)
- Email/password with 2FA support
- Token-based authentication
- QR code login capability
- Automatic cookie refresh mechanism

**Design Pattern:** The login system uses neokex-fca (imported from npm) instead of a local fb-chat-api copy. The login uses a fallback chain - attempts cookie authentication first, falls back to email/password if needed, and includes checkpoint recovery handlers for Facebook security challenges.

**Implementation:** Login is handled in `bot/login/login.js` which requires neokex-fca and passes appState to the login function with configured options from `config.json`.

### Database Architecture
**Problem:** Need flexible data storage that works across different environments (local, cloud, VPS).

**Solution:** Abstraction layer supporting three database types:
- **JSON** - File-based storage for simple deployments
- **SQLite** - Embedded database for moderate scale
- **MongoDB** - Cloud-ready NoSQL for production

**Design Pattern:** Repository pattern with unified interface (`usersData`, `threadsData`, `globalData`) that abstracts underlying storage implementation. Task queue system ensures write operations are serialized to prevent race conditions.

**Trade-offs:** 
- JSON is simple but doesn't scale well
- SQLite balances simplicity and performance
- MongoDB requires external service but offers best scalability

### Command System
**Problem:** Enable extensible bot functionality where commands can be easily added, updated, or removed without modifying core code.

**Solution:** Plugin-based architecture where commands are self-contained modules in `scripts/cmds/`. Each command exports:
- Configuration (name, version, permissions, cooldowns)
- Multi-language support
- `onStart` handler for execution
- Optional `onChat`, `onReply`, `onReaction` handlers

**Design Pattern:** Command modules use a consistent interface with dependency injection (receive `api`, `message`, `event`, `threadsData`, `usersData`, etc.). Commands are hot-reloadable and support aliases.

### Event Handling System
**Problem:** Process various Facebook events (messages, reactions, member changes) efficiently while maintaining modularity.

**Solution:** Event-driven architecture with specialized handlers:
- `handlerEvents.js` - Routes events to appropriate command/event handlers
- `handlerCheckData.js` - Ensures user/thread data exists before processing
- Event modules in `scripts/events/` for automated behaviors (welcome messages, leave notifications, auto-moderation)

**Design Pattern:** Chain of Responsibility pattern where events pass through multiple handlers. Task queues prevent race conditions during concurrent event processing.

### Permission & Access Control
**Problem:** Manage hierarchical permissions (bot admin, group admin, regular users) across commands and features while ensuring reliability during cold starts and data migrations.

**Solution:** Five-tier role system with defensive resolution:
- Role 0: Regular users
- Role 1: Group administrators
- Role 2: Bot administrators (configured in `config.json`)
- Role 3: Premium users (balance >= 2000)
- Role 4: Bot developers (highest privilege)

**Implementation Details:**
- **Deterministic resolution tiers:** Static roles (developers, admins) checked first, then thread admins, then custom user roles
- **Backward compatibility:** Automatically migrates legacy role data from `userData.role`, `userData.data.rank` to `userData.data.customRole`
- **Cold start protection:** Falls back to cached user data when database is initializing to prevent security vulnerabilities
- **Role validation:** Enforces 0-4 range and rejects invalid values
- **Performance optimization:** 5-second cache per user to reduce database queries
- **Error handling:** Logs all resolution failures with context for debugging

Each command specifies required role. Additional modes include `adminOnly` (bot-wide) and `onlyAdminBox` (per-group).

**Security Considerations:** The refactored `getRole` function in `bot/handler/handlerEvents.js` prevents critical issues where cold starts or database failures could incorrectly downgrade admin roles to role 0, bypassing security controls.

### Auto-Uptime & Monitoring
**Problem:** Keep bot alive on platforms that sleep inactive processes (Replit, Glitch).

**Solution:** HTTP server endpoint that responds to external monitors (UptimeRobot, BetterStack). Socket.IO integration allows real-time status monitoring.

**Design Pattern:** Health check endpoint at `/uptime` returns bot status. External services ping this endpoint at intervals to prevent platform sleep.

### Multi-Language Support
**Problem:** Support users in different languages without code duplication.

**Solution:** Language file system (`languages/*.lang`) with key-value translations. Each command/event accesses translations via `getLang()` function.

**Design Pattern:** Text externalization pattern where all user-facing strings are stored in language files, referenced by keys like `commandName.messageKey`.

## External Dependencies

### Core Dependencies
- **neokex-fca** - Unofficial Facebook Chat API for authentication and messaging
- **express** - Web server for dashboard and uptime endpoints
- **socket.io** - Real-time bidirectional communication for monitoring
- **googleapis** - Google Drive integration for file storage
- **nodemailer** - Email notifications for errors and alerts

### Database Drivers
- **mongoose** - MongoDB ODM (when using MongoDB mode)
- **sequelize** - SQL ORM supporting SQLite
- **sqlite3** - SQLite database driver
- **fs-extra** - Enhanced file system operations (for JSON mode)

### Media & Processing
- **canvas** - Image manipulation for avatar generation
- **axios** - HTTP client for API requests
- **cheerio** - HTML parsing for web scraping
- **qrcode-reader** - QR code processing for login

### Authentication & Security
- **bcrypt** - Password hashing
- **passport** / **passport-local** - Dashboard authentication
- **express-session** - Session management
- **totp-generator** - Two-factor authentication support

### Utilities
- **moment-timezone** - Date/time handling with timezone support
- **lodash** - Utility functions for data manipulation
- **gradient-string** - Console output styling
- **ora** - Terminal spinners for loading states

### Third-Party Services (Optional)
- **Google Cloud Console** - OAuth credentials for Google Drive integration
- **reCAPTCHA v2** - Bot protection for dashboard
- **UptimeRobot / BetterStack** - External monitoring services
- **MongoDB Atlas** - Cloud MongoDB hosting (if using MongoDB mode)

**Note:** The application uses Facebook's unofficial API which operates in a legal gray area. Facebook may block or ban accounts using this method. Users should employ throwaway accounts and understand the risks.