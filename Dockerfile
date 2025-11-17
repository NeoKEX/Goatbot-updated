# 1. Base Image: Start from an official Node.js base image.
FROM node:20-slim

# 2. Install System Dependencies: Install fontconfig and fonts required by canvas library
RUN apt-get update && \
    apt-get install -y fontconfig fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/* && \
    fc-cache -f -v

# 3. Working Directory: Set up a folder inside the container for your application.
WORKDIR /usr/src/app

# 4. Copy Dependency Files: Copy package and lock files first.
COPY package*.json ./

# 5. Install Dependencies: Install your project's dependencies.
RUN npm install --omit=dev

# 6. Copy Application Code: Copy the rest of your application files.
COPY . .

# 7. Start Command: This runs your bot indefinitely.
CMD [ "node", "index.js" ]
