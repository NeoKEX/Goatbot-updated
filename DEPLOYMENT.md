# Deployment Guide for Free Tier Hosting

This guide covers deploying your GoatBot V2 on **Render** and **Railway** using their free tiers.

## 🆓 Free Tier Comparison

### Render Free Tier
- ✅ 750 hours/month free
- ✅ Easy to set up
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ 512 MB RAM limit
- 💡 Best for: Testing or low-usage bots

### Railway Free Tier
- ✅ $5 free credit/month
- ✅ No automatic spin-down
- ✅ Better for 24/7 operation
- ⚠️ Credits deplete based on usage
- 💡 Best for: Production bots that need constant uptime

---

## 🚀 Deploy to Railway (Recommended for Free Tier)

### Step 1: Prepare Your Repository
1. Make sure all files are committed to GitHub
2. Ensure `config.json` doesn't contain sensitive data (use environment variables instead)

### Step 2: Deploy on Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will automatically detect the `railway.json` and `Dockerfile`

### Step 3: Configure Environment Variables (Optional)
If you want to override config.json settings:
- Go to your project → Variables tab
- Add any needed environment variables (see `.env.example`)

### Step 4: Monitor Your Bot
- Check logs in Railway dashboard
- Your bot should start automatically

**Free Tier Tips:**
- Monitor your credit usage in Railway dashboard
- $5/month typically covers ~100-200 hours of runtime
- Optimize your bot to reduce unnecessary processing

---

## 🎨 Deploy to Render

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Ensure sensitive data is not in `config.json`

### Step 2: Deploy on Render
1. Go to [Render.com](https://render.com)
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will auto-detect the Dockerfile

### Step 3: Configure Service
- **Name**: Choose a name (e.g., goat-bot-v2)
- **Region**: Choose closest to you
- **Branch**: main (or your default branch)
- **Instance Type**: Free
- Click "Create Web Service"

### Step 4: Important Note About Free Tier
⚠️ **Render free tier spins down after 15 minutes of inactivity**

To keep your bot running:
- Enable `autoUptime` in `config.json`:
  ```json
  "autoUptime": {
    "enable": true,
    "timeInterval": 840,
    "url": "https://your-app-name.onrender.com"
  }
  ```
- This pings your service every 14 minutes to prevent spin-down
- Alternative: Upgrade to paid tier ($7/month) for 24/7 uptime

---

## ⚙️ Configuration Tips

### 1. Database Selection
For free tier hosting, use **SQLite** (already configured):
```json
"database": {
  "type": "sqlite"
}
```

### 2. Reduce Memory Usage
- Disable unnecessary features in `config.json`
- Set `logEvents.disableAll: true` if you don't need detailed logs

### 3. Handle Disconnections
- Enable auto-reconnect features:
```json
"autoReloginWhenChangeAccount": true,
"autoRestartWhenListenMqttError": true
```

---

## 🔒 Security Best Practices

### Never Commit Sensitive Data
1. Remove credentials from `config.json` before pushing:
   ```json
   "facebookAccount": {
     "email": "",
     "password": ""
   }
   ```

2. Use environment variables instead:
   - Railway: Project Settings → Variables
   - Render: Environment tab

3. Add `config.json` to `.gitignore` if it contains secrets

---

## 🐛 Troubleshooting

### Bot Not Starting
1. Check logs in your hosting platform
2. Verify all required dependencies are installed
3. Ensure Facebook credentials are correct

### Render Service Spinning Down
- Enable the `autoUptime` feature (see above)
- Or use Railway instead for better free tier uptime

### Out of Railway Credits
- Monitor usage in Railway dashboard
- Optimize bot to reduce CPU/memory usage
- Consider upgrading if needed

### Canvas/Image Processing Errors
- The Dockerfile includes all required system libraries
- If errors persist, check platform logs

---

## 📊 Monitoring

### Railway
- View logs: Project → Deployments → View Logs
- Check metrics: Project → Metrics
- Monitor credits: Account → Usage

### Render
- View logs: Service → Logs tab
- Check events: Service → Events tab
- Monitor uptime: Service dashboard

---

## 💡 Recommendations

**For Best Free Tier Experience:**
1. ✅ Use Railway for 24/7 bot operation
2. ✅ Use SQLite database (no external DB needed)
3. ✅ Monitor your usage regularly
4. ✅ Optimize your bot code to reduce resource usage

**When to Upgrade:**
- Bot needs guaranteed 24/7 uptime
- High message volume (>1000 messages/day)
- Running multiple bots
- Need more than 512MB RAM

---

## 🆘 Need Help?

- Check Railway docs: https://docs.railway.app
- Check Render docs: https://render.com/docs
- GoatBot issues: https://github.com/ntkhang03/Goat-Bot-V2/issues

---

**Happy Hosting! 🎉**
