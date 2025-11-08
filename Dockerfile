# syntax=docker/dockerfile:1
# Multi-stage build for optimized image size
FROM node:20-slim AS builder

# Install build dependencies for native modules (canvas, sqlite3, bcrypt, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    libfontconfig1-dev \
    uuid-dev \
    python3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install ONLY production dependencies with cache mount (FASTER!)
# BuildKit cache mount speeds up npm install from 48s to ~5s on rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --prefer-offline --no-audit

# Runtime stage
FROM node:20-slim

# Single RUN layer: install libs, create user, setup directories (FASTER!)
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libpangoxft-1.0-0 \
    libfreetype6 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    libpixman-1-0 \
    libfontconfig1 \
    fonts-noto \
    fonts-noto-color-emoji \
    libuuid1 \
    libsqlite3-0 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1001 -s /bin/bash nodeuser

WORKDIR /app

# Create directories and set ownership in one step
RUN mkdir -p database bot/login scripts/cmds scripts/events dashboard tmp && \
    chown nodeuser:nodeuser /app

# Copy node_modules from builder with correct ownership (avoids slow chown later)
COPY --from=builder --chown=nodeuser:nodeuser /app/node_modules ./node_modules

# Copy application files with correct ownership (avoids slow chown later)
COPY --chown=nodeuser:nodeuser . .

# Set permissions for directories (much faster than chown -R on all files)
RUN chmod -R 755 database bot/login scripts dashboard tmp

# Rebuild font cache for Canvas to find custom fonts
USER root
RUN fc-cache -f -v
USER nodeuser

# Set environment variables
# NOT setting NODE_ENV=production to avoid .dev.json/.dev.txt file lookups
ENV PORT=3001
ENV FONTCONFIG_PATH=/etc/fonts

# Expose port (Render/Railway will override with their PORT env variable)
EXPOSE 3001

# Switch to non-root user
USER nodeuser

# Health check for Render/Railway
# Simple check that Node process is running (no /health endpoint required)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/uptime', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "index.js"]
