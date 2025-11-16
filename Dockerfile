# Use Node.js 20 LTS
FROM node:20-slim

# Install system dependencies required for native Node modules (canvas, sqlite3)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Create database directory
RUN mkdir -p database

# Set environment to production
ENV NODE_ENV=production

# Expose port (if your bot has a web interface/health check endpoint)
EXPOSE 3000

# Use the startup script
CMD ["./start.sh"]
