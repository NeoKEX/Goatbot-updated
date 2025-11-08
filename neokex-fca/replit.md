# NeoKEX-FCA

## Overview

NeoKEX-FCA is an advanced Facebook Chat API library for Node.js that enables developers to build powerful Messenger bots. The library provides comprehensive real-time messaging capabilities through MQTT protocol, rich media support, thread management, and extensive social features. It's designed as an enterprise-grade solution with built-in performance optimization, connection management, plugin extensibility, and webhook integration.

**Status:** Ready for npm publishing ✅

## Recent Changes (November 2025)

### NPM Publishing Preparation
- Removed all single-line (`//`) comments from codebase
- Added NeoKEX credits to main entry points (index.js, core.js, utils.js)
- Added ws3-fca inspiration credit to README
- Cleaned up test files and unnecessary documentation
- Created professional .npmignore file
- Updated package.json with proper npm fields (files, types, keywords)

### Logging System Overhaul
- Removed gradient-string dependency for cleaner output
- Implemented modern hex color scheme:
  - Primary brand color: #2563eb (blue)
  - Success/log: #10b981 (green)
  - Warning: #f59e0b (amber)
  - Error: #ef4444 (red)
  - Debug: #6b7280 (gray)
  - Trace: #8b5cf6 (purple)
- Added timestamp prefix with 24-hour format
- Added visual symbols (✓, ⚠, ✗) for better readability

### Critical Bug Fixes
1. **MQTT Error Handler Crash** - Fixed undefined reference to `api.neokex.relogin()` that caused crashes on disconnect
2. **Reconnection Race Condition** - Fixed issue where old client callback would null out new client reference during auto-reconnect

### Branding Cleanup
- Removed all contributor names except NeoKEX from source code
- Removed references to ws3-fca in code (kept as inspiration credit in README)
- Standardized all branding to NeoKEX across the library

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Authentication & Session Management

**Problem**: Facebook's authentication requires secure cookie-based sessions and credential validation.

**Solution**: Cookie jar-based authentication using `tough-cookie` with session state persistence through `appState` JSON. Includes `SessionValidator` for pre-connection credential verification.

**Rationale**: Cookie-based sessions mimic browser behavior, reducing detection risk. AppState persistence allows session reuse without repeated logins.

### Communication Protocol

**Problem**: Real-time bidirectional messaging with Facebook's infrastructure.

**Solution**: MQTT over WebSocket using the `mqtt` and `websocket-stream` libraries for primary communication. HTTP/HTTPS for API calls and file uploads.

**Alternatives Considered**: Pure HTTP polling would be inefficient for real-time events.

**Pros**: Low latency, efficient bandwidth usage, native support for real-time events.

**Cons**: More complex connection management, requires WebSocket support.

### Core Architecture Pattern

**Problem**: Need modular, extensible API methods while maintaining shared context.

**Solution**: Factory pattern where each API method is a module that receives `defaultFuncs`, `api`, and `ctx` (context) objects. Methods are dynamically attached to the API instance.

**Rationale**: Enables clean separation of concerns, easy testing of individual methods, and shared state through context object.

### Plugin System

**Problem**: Extensibility for custom functionality without core modifications.

**Solution**: `PluginManager` class that loads and initializes plugins with access to the API instance and event system.

**Design**: Plugins can register commands, handle events, and extend API functionality through the `addExternalModule` mechanism.

### Event Handling

**Problem**: Processing various event types (messages, reactions, thread changes, etc.) from Facebook.

**Solution**: Event-driven architecture using Node.js EventEmitter pattern. The `listenMqtt` function processes incoming MQTT messages and emits typed events.

**Message Flow**:
1. MQTT client receives raw messages
2. Events are parsed and formatted based on `__typename`
3. Typed events are emitted to registered listeners
4. Auto-mark delivery/read features hook into event flow

### Performance Optimization

**Problem**: API rate limiting and redundant requests degrading performance.

**Solution**: `PerformanceOptimizer` class implementing:
- LRU caching for frequently accessed data (thread info, user info)
- Request debouncing to prevent duplicate operations
- Performance metrics tracking

**Benefits**: Reduced API calls, faster response times, better resource utilization.

### Connection Management

**Problem**: Network instability and connection drops requiring intelligent recovery.

**Solution**: `ConnectionManager` implementing:
- Health monitoring with ping/pong checks
- Exponential backoff reconnection strategy
- Connection state tracking and event emission
- Configurable retry limits

**Rationale**: Prevents server overwhelming during outages while maintaining connection reliability.

**Recent Fix**: Resolved race condition where old MQTT client shutdown callback would null out newly created client reference during auto-reconnect.

### Error Handling

**Problem**: Comprehensive error reporting and debugging.

**Solution**: Custom error classes (`CustomError`, `FacebookError`, etc.) in `lib/utils/errors.js` with structured error information.

**Design**: Errors include context, error codes, and descriptive messages for easier debugging.

### Logging System

**Problem**: Debugging and monitoring bot behavior in production.

**Solution**: `Logger` class with configurable log levels, color-coded console output, and optional file output.

**Features**: 
- Modern hex color scheme for professional appearance
- Timestamp prefixing with 24-hour format
- Visual symbols for quick identification
- Categorized logging (info, warn, error, debug, trace)
- Stacktrace capture

### HTTP Request Layer

**Problem**: Making authenticated requests to Facebook's various endpoints.

**Solution**: Wrapper functions (`httpGet`, `httpPost`, `httpPostFormData`) built on `axios` with:
- Cookie jar integration (`axios-cookiejar-support`)
- Proxy support (`https-proxy-agent`)
- Custom headers and form data handling
- Automatic login state checking

### Message Sending Architecture

**Problem**: Multiple message types (text, attachments, stickers, reactions) with different requirements.

**Solution**: Dual implementation approach:
- `sendMessage`: HTTP-based for compatibility
- `sendMessageMqtt`: MQTT-based for real-time performance

**Attachment Flow**:
1. Validate readable streams
2. Upload to Facebook's upload endpoint
3. Receive attachment metadata
4. Include metadata in message payload

### Thread Management

**Problem**: Complex thread operations (admin controls, customization, member management).

**Solution**: Dedicated API methods for each operation using Facebook's GraphQL API where available, falling back to legacy endpoints.

**Examples**:
- `changeAdminStatus`: Promote/demote group admins
- `changeThreadColor`: Customize thread appearance
- `changeNickname`: Set user-specific nicknames

## External Dependencies

### Core Communication
- **mqtt** (v3.x): MQTT client for real-time messaging protocol
- **websocket-stream** (v5.x): WebSocket streaming for MQTT over WS

### HTTP & Networking
- **axios** (v1.x): HTTP client for API requests
- **axios-cookiejar-support** (v4.x): Cookie jar integration for axios
- **tough-cookie** (v5.x): Cookie parsing and management
- **https-proxy-agent** (v4.x): Proxy support for HTTPS requests

### Data Processing
- **cheerio** (v0.22.x): HTML parsing for scraping Facebook pages
- **form-data** (v4.x): Multipart form data for file uploads
- **lodash** (v4.x): Utility functions for data manipulation

### Utilities
- **chalk** (v3.x): Terminal output colorization
- **node-cron** (v3.x): Scheduled task execution

### Development
- **request** (v2.x): Legacy HTTP client (being phased out)

### Facebook Integration
No official Facebook SDK used. Direct API integration through:
- GraphQL API (graph.facebook.com)
- Legacy AJAX endpoints (www.facebook.com/ajax/*)
- Upload endpoints (upload.facebook.com)
- MQTT endpoints (edge-chat.facebook.com)

**Authentication**: Cookie-based sessions, no OAuth tokens required.

## NPM Publishing Checklist

✅ Package name: neokex-fca  
✅ Version: 2.0.0  
✅ Main entry: index.js  
✅ TypeScript definitions: lib/types/types/index.d.ts  
✅ Files field configured with whitelist  
✅ .npmignore created  
✅ Keywords added (15 total)  
✅ Author: NeoKEX  
✅ License: MIT  
✅ Test files removed  
✅ Unnecessary files cleaned up  
✅ Logging system modernized  
✅ Critical bugs fixed  
✅ All comments removed  
✅ Credits added  
✅ README professionally formatted  

## Publishing Commands

```bash
# Test package contents
npm pack --dry-run

# Publish to npm (when ready)
npm publish
```

## Credits

**Author**: NeoKEX (https://github.com/NeoKEX)  
**Repository**: https://github.com/NeoKEX/neokex-fca.git  
**Inspired by**: ws3-fca
