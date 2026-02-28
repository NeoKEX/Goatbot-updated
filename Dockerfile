FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "index.js"]
