# Quick Free Tier Setup Checklist ✅

## Before Deployment

### 1. Secure Your Config
- [ ] Remove sensitive data from `config.json` (email, password, API keys)
- [ ] Add `config.json` to `.gitignore` if it contains secrets
- [ ] Use environment variables for sensitive data

### 2. Optimize for Free Tier
- [ ] Set database type to `"sqlite"` in `config.json`
- [ ] Consider disabling detailed logging to save resources:
  ```json
  "logEvents": {
    "disableAll": false,
    "read_receipt": false,
    "typ": false,
    "presence": false
  }
  ```

### 3. Choose Your Platform

**Railway (Recommended)** ⭐
- ✅ No spin-down
- ✅ $5 free credits/month
- ✅ Better for 24/7 bots
- 🔗 Go to: https://railway.app

**Render**
- ✅ Easy setup
- ⚠️ Spins down after 15 min (needs keep-alive)
- 🔗 Go to: https://render.com

---

## Railway Deployment (5 Minutes)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Docker deployment files"
   git push
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Wait for automatic deployment

3. **Add Environment Variables** (Optional)
   - Click your project → "Variables"
   - Add Facebook credentials if not in config.json:
     - `FB_EMAIL`: your-email@example.com
     - `FB_PASSWORD`: your-password

4. **Done!** 🎉
   - Check "Deployments" tab for logs
   - Your bot is now running 24/7

---

## Render Deployment (7 Minutes)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Docker deployment files"
   git push
   ```

2. **Deploy on Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select "Free" plan
   - Click "Create Web Service"

3. **Enable Keep-Alive** (Important!)
   
   Edit `config.json`:
   ```json
   "autoUptime": {
     "enable": true,
     "timeInterval": 840,
     "url": "https://your-service-name.onrender.com"
   }
   ```
   
   Replace `your-service-name` with your actual Render service URL.

4. **Redeploy**
   - Commit the config change
   - Render will auto-deploy

5. **Done!** 🎉
   - Check "Logs" tab to verify it's running

---

## Post-Deployment Checklist

- [ ] Check logs to ensure bot logged in successfully
- [ ] Send a test message to your bot
- [ ] Monitor resource usage (Railway credits or Render hours)
- [ ] Set up notifications in `config.json` (optional)

---

## Common Issues

### "Cannot open shared object file" Error
✅ **Fixed** - The Dockerfile includes all required system libraries

### Bot Not Responding
1. Check logs for login errors
2. Verify Facebook credentials are correct
3. Make sure you're not using 2FA (or provide 2FA secret)

### Render Service Offline
- Ensure `autoUptime` is enabled in config.json
- Check if you exceeded 750 hours/month

### Railway Out of Credits
- Monitor usage at railway.app/account
- $5 typically covers 100-200 hours
- Consider optimizing your bot or upgrading

---

## Resource Monitoring

### Railway
```
Dashboard → Your Project → Metrics
```
- Watch CPU, Memory, Network usage
- Monitor credits remaining

### Render
```
Dashboard → Your Service → Metrics
```
- Watch uptime hours
- Check if service is spinning down

---

## 💡 Pro Tips

1. **Use Railway for production** - Better uptime on free tier
2. **Use Render for testing** - Easy to set up multiple test instances
3. **Monitor your usage** - Set calendar reminders to check monthly
4. **Optimize commands** - Disable unused features to save resources
5. **Keep credentials secure** - Never commit passwords to GitHub

---

## Need Help?

📖 Full guide: See `DEPLOYMENT.md`
🐛 Issues: Check logs first, then GitHub issues
💬 Community: GoatBot GitHub discussions

**Happy Hosting! 🚀**
