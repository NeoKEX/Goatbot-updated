FROM node:20-slim

WORKDIR /app

# Install build dependencies required for native modules (canvas, sqlite3, etc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango-1.0-0 \
    libpango-cairo-1.0-0 \
    libgif-dev \
    libpixman-1-dev \
    && rm -rf /var/lib/apt/lists/* || true

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Run the bot
CMD ["npm", "start"]
