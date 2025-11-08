# syntax=docker/dockerfile:1
# Optimized multi-stage build for Canvas-enabled bot
FROM node:20-alpine AS builder

# Install build dependencies (Alpine uses apk, much smaller and faster than apt)
RUN apk add --no-cache --virtual .build-deps \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    python3 \
    sqlite-dev \
    pkgconf

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install ONLY production dependencies with cache mount (FASTER!)
# BuildKit cache mount speeds up npm install significantly on rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --prefer-offline --no-audit

# ---
# Runtime stage - using Alpine for 80% smaller image
FROM node:20-alpine

# Install runtime dependencies (Alpine: minimal size, fast installation)
# Removed 'util-linux-libs' as it is not an Alpine package name.
RUN apk add --no-cache \
    cairo \
    pango \
    giflib \
    pixman \
    libjpeg-turbo \
    freetype \
    fontconfig \
    ttf-dejavu \
    sqlite-libs \
    curl \
    && adduser -D -u 1001 nodeuser

WORKDIR /app

# Create directories and set ownership in one step
# FIX APPLIED HERE: Explicitly create 'database/data' and use recursive chown
RUN mkdir -p database/data bot/login scripts/cmds scripts/events dashboard tmp && \
    chown -R nodeuser:nodeuser /app

# Copy node_modules from builder with correct ownership
COPY --from=builder --chown=nodeuser:nodeuser /app/node_modules ./node_modules

# Copy only necessary application files
COPY --chown=nodeuser:nodeuser package*.json index.js Goat.js utils.js config.json configCommands.json ./
# FIX: Copy the required account.txt file
COPY --chown=nodeuser:nodeuser account.txt ./
COPY --chown=nodeuser:nodeuser bot ./bot
COPY --chown=nodeuser:nodeuser dashboard ./dashboard
COPY --chown=nodeuser:nodeuser database/connectDB ./database/connectDB
COPY --chown=nodeuser:nodeuser database/controller ./database/controller
COPY --chown=nodeuser:nodeuser database/models ./database/models
COPY --chown=nodeuser:nodeuser func ./func
COPY --chown=nodeuser:nodeuser languages ./languages
COPY --chown=nodeuser:nodeuser logger ./logger
COPY --chown=nodeuser:nodeuser scripts ./scripts
COPY --chown=nodeuser:nodeuser neokex-fca ./neokex-fca

# Rebuild font cache for Canvas (Alpine uses fc-cache directly)
RUN fc-cache -f -v

# Set environment variables
ENV PORT=3001 \
    FONTCONFIG_PATH=/etc/fonts

# Expose port (Render/Railway will override with their PORT env variable)
EXPOSE 3001

# Switch to non-root user
USER nodeuser

# Optimized health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/uptime', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "index.js"]
