# 🚀 Deployment Guide

This guide will help you deploy Goat Bot V2 on various hosting platforms.

## 📋 Table of Contents
- [Render](#render) (Free tier - Docker)
- [Railway](#railway) (Free tier - $5 credit/month)
- [Replit](#replit) (Free tier - Always-on paid)
- [VPS/Server](#vpsserver) (Recommended for 24/7)
- [Docker Configuration](#docker-configuration)
- [Troubleshooting](#troubleshooting)

---

## 🔷 Render

### Prerequisites
- A [Render account](https://render.com)
- Your Facebook account credentials

### Steps
1. **Fork this repository** to your GitHub account

2. **Create a New Web Service** on Render
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the Service**
   - **Name**: `goat-bot-v2` (or your preferred name)
   - **Environment**: `Docker` (recommended for stability)
   - **Plan**: Free (limited to 0.5GB RAM)
   - Dockerfile is auto-detected from root directory

4. **Set Environment Variables**
   - Go to "Environment" tab
   - Add any custom environment variables if needed
   - `NODE_ENV` is set to `production` by default in render.yaml

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (takes ~2-3 minutes)

### Important Notes
- Render's free tier has limitations (sleeps after inactivity)
- Uses Docker with `node:20-slim` base image (optimized for free tier)
- Build dependencies included: Python3, Make, G++ (for native modules)
- **Background Service Type**: No healthcheck required (bot is not a web server)
- Bot will restart automatically when you push to GitHub
- Use paid tier ($7+/month) for 24/7 operation without sleep
- Monitor bot activity in the Logs tab

### Expected Deployment Success Indicators
```
LOGIN FACEBOOK: Successful login
DATABASE: Loaded X group's data successfully
LOADED: 86 commands
BOT_STARTED: Bot has been started successfully
```

---

## 🔷 Railway

### Prerequisites
- A [Railway account](https://railway.app)
- Your Facebook account credentials

### Steps
1. **Deploy from GitHub**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository

2. **Configuration**
   - Railway will auto-detect Node.js using NIXPACKS builder
   - The `railway.json` file is already configured
   - No additional setup needed!

3. **Environment Variables** (Optional)
   - Click on your project → "Variables"
   - Add any custom environment variables if needed
   - `NODE_ENV=production` is set by default

4. **Start the Bot**
   - Railway will automatically start your bot
   - Check logs for any errors
   - Bot will auto-restart on failure (max 10 retries)

### Important Notes
- Railway offers $5 free credit monthly (sufficient for ~40 hours)
- Bot runs 24/7 within free tier allocation
- Excellent for development and continuous testing
- After free credit expires, no charges unless you upgrade
- Uses NIXPACKS for optimized builds
- **No healthcheck required** - auto-restart configured with max 10 retries

---

## 🔷 Replit

### Prerequisites
- A [Replit account](https://replit.com)
- Your Facebook account credentials

### Steps
1. **Import Repository**
   - Go to [Replit](https://replit.com)
   - Click "Create Repl" → "Import from GitHub"
   - Paste repository URL

2. **Configure Bot**
   - Edit `config.json` with your Facebook credentials
   - Add your admin ID to `adminBot` array

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Run the Bot**
   ```bash
   npm start
   ```

5. **Keep Bot Alive** (Important!)
   - Replit free tier stops after inactivity
   - Use a service like [UptimeRobot](https://uptimerobot.com/)
   - Monitor your Replit URL to keep it active

### Important Notes
- Enable "Always On" in Replit (paid feature)
- Or use UptimeRobot to ping your bot periodically
- Check console for login errors

---

## 🔷 VPS/Server

### Prerequisites
- A VPS (Ubuntu 20.04+ recommended)
- SSH access
- Node.js 16.x or 20.x installed

### Steps

1. **Connect to Your Server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js** (if not installed)
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/ntkhang03/Goat-Bot-V2.git
   cd Goat-Bot-V2
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Configure Bot**
   ```bash
   nano config.json
   ```
   - Add your Facebook credentials
   - Add your admin ID
   - Save and exit (Ctrl+X, Y, Enter)

6. **Run with PM2** (Recommended)
   ```bash
   npm install -g pm2
   pm2 start index.js --name goat-bot
   pm2 save
   pm2 startup
   ```

7. **Check Status**
   ```bash
   pm2 status
   pm2 logs goat-bot
   ```

### Useful PM2 Commands
```bash
pm2 restart goat-bot   # Restart bot
pm2 stop goat-bot      # Stop bot
pm2 delete goat-bot    # Remove from PM2
pm2 logs goat-bot      # View logs
```

---

## 🐳 Docker Configuration

### Overview
- **Dockerfile**: Uses `node:20-slim` base image with build dependencies
- **render.yaml**: Render deployment configuration with healthcheck
- **railway.json**: Railway deployment configuration
- **docker-compose.yml**: Local development with Docker

### Key Features
- **Base Image**: Debian Slim (includes Python, Make, G++ for native modules)
- **Memory Optimization**: ~500MB total (within 0.5GB free tier limit)
- **Health Endpoint**: `/health` returns `{"status":"ok"}`
- **Port**: 8080 (set via `process.env.PORT`)

### Local Docker Testing
```bash
# Build image
docker build -t goat-bot-v2 .

# Run with local config
docker run -v $(pwd)/config.json:/app/config.json \
           -v $(pwd)/account.txt:/app/account.txt \
           -v $(pwd)/appstate.json:/app/appstate.json \
           -p 8080:8080 \
           goat-bot-v2

# Or use docker-compose
docker-compose up -d
docker-compose logs -f goat-bot
docker-compose down
```

### Recent Docker Updates (November 2025)
- ✅ Fixed: Changed from Alpine to Slim base (Alpine lacked build tools)
- ✅ Fixed: Changed from web to background service (removes healthcheck requirement)
- ✅ Fixed: Dashboard now listens on Render's PORT environment variable
- ✅ Added: `/health` endpoint for manual monitoring (optional)
- ✅ Verified: All 86 commands load correctly
- ✅ Verified: Database connectivity working
- ✅ Verified: Render deployment now succeeds without healthcheck blocking

---

## ⚙️ Configuration

### Essential Config (config.json)
```json
{
  "facebookAccount": {
    "email": "your-facebook-email",
    "password": "your-facebook-password"
  },
  "adminBot": ["your-user-id"],
  "devUsers": [],
  "premiumUsers": [],
  "prefix": "-"
}
```

### Finding Your User ID
1. Send a message to your bot
2. Check console logs
3. Look for your ID in the logs
4. Add it to `adminBot` array

---

## 🔧 Troubleshooting

### Docker Deployment Issues

**Build Failed**
- Ensure Python3, Make, G++ are in Dockerfile
- Check that `npm ci --omit=dev` completes successfully
- Verify `.dockerignore` excludes large files

**Service Stuck "Building" or "Restarting"**
- Render background services don't use healthchecks
- Service should start automatically after build completes
- Check logs for "BOT_STARTED" message to verify bot is running
- If stuck, try manual redeploy from Render dashboard

**Bot Won't Connect**
- Verify config.json has valid Facebook credentials
- Check that account.txt and appstate.json exist
- Look for login error messages in logs

### Bot Won't Login
- **Check credentials** in config.json
- **Enable "Less Secure App Access"** (if using old FB account)
- **Try using app state** instead of email/password
- **Check 2FA** - add secret to config if enabled

### Bot Crashes Repeatedly
- **Check Node.js version**: Must be 16.x or 20.x
- **Clear node_modules**: `rm -rf node_modules && npm install`
- **Check logs**: Look for specific error messages
- **Update dependencies**: `npm update`

### Commands Not Working
- **Check prefix** in config.json
- **Verify permissions**: Some commands require admin role
- **Check logs** for error messages
- **Restart bot** after config changes

### Account Locked/Restricted
- **Use clone account** (recommended)
- **Don't spam** messages too quickly
- **Wait** before trying again
- **Use app state** instead of login credentials

---

## 📞 Support

If you encounter issues:
- Check [GitHub Issues](https://github.com/ntkhang03/Goat-Bot-V2/issues)
- Join the [Discord Server](https://discord.com/invite/DbyGwmkpVY)
- Read [Documentation](https://github.com/ntkhang03/Goat-Bot-V2/blob/main/DOCS.md)

---

## 🎯 Tips for Success

1. **Always use a clone/secondary Facebook account**
2. **Don't spam** - respect rate limits
3. **Keep bot updated** - pull latest changes regularly
4. **Monitor logs** - catch issues early
5. **Backup data** - save your database regularly
6. **Use PM2** on VPS for auto-restart
7. **Set up auto-updates** for dependencies

---

**Created by NTKhang | Enhanced by NeoKEX**