# 1. Base Image: Start from an official Node.js base image.
FROM node:20-slim

# 2. Working Directory: Set up a folder inside the container for your application.
WORKDIR /usr/src/app

# 3. Copy Dependency Files: Copy package and lock files first.
COPY package*.json ./

# 4. Install Dependencies: Install your project's dependencies.
RUN npm install --omit=dev

# 5. Copy Application Code: Copy the rest of your application files.
COPY . .

# 6. Start Command: This runs your bot indefinitely.
CMD [ "node", "index.js" ]
