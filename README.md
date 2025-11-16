<div align="center">

<!-- Animated Banner -->
<img src="https://i.ibb.co/RQ28H2p/banner.png" alt="GoatBot Banner" width="100%">

<!-- Animated Title -->
<h1>
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=Goat%20Bot%20V2&fontSize=42&fontColor=fff&animation=twinkling&fontAlignY=32" width="100%"/>
</h1>

<!-- Animated Subtitle with Typing Effect -->
<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=00D9FF&center=true&vCenter=true&multiline=true&width=600&height=100&lines=A+Powerful+Messenger+Chat+Bot;Built+with+%E2%9D%A4%EF%B8%8F+and+Node.js;Featuring+Advanced+Commands" alt="Typing SVG" />
</p>

<!-- Animated Badges -->
<p align="center">
  <a href="https://nodejs.org/dist/v16.20.0">
    <img src="https://img.shields.io/badge/Node.js-16.x-brightgreen.svg?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js Support">
  </a>
  <img src="https://img.shields.io/github/repo-size/ntkhang03/Goat-Bot-V2.svg?style=for-the-badge&label=Size&color=blue&logo=github" alt="Repo Size">
  <img src="https://img.shields.io/badge/dynamic/json?color=orange&label=Version&prefix=v&query=%24.version&url=https://github.com/ntkhang03/Goat-Bot-V2/raw/main/package.json&style=for-the-badge&logo=semver" alt="Version">
  <img src="https://visitor-badge.laobi.icu/badge?style=for-the-badge&page_id=ntkhang3.Goat-Bot-V2&color=blueviolet" alt="Visitors">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License">
</p>

<!-- Animated Divider -->
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

<!-- Credits Section with Animation -->
<h2>
  <img src="https://media.giphy.com/media/iY8CRBdQXODJSCERIr/giphy.gif" width="30px"> 
  Credits & Contributors
</h2>

<p align="center">
  <b>Created By:</b> <a href="https://github.com/ntkhang03">NTKhang</a> 
  <br>
  <b>Enhanced By:</b> <a href="https://github.com/NeoKEX">NeoKEX</a>
  <br><br>
  <img src="https://img.shields.io/badge/Original%20Creator-NTKhang-blue?style=for-the-badge&logo=github" alt="NTKhang">
  <img src="https://img.shields.io/badge/Enhanced%20By-NeoKEX-red?style=for-the-badge&logo=github" alt="NeoKEX">
</p>

<!-- Important Notice with Pulse Animation -->
<h3>
  <img src="https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif" width="35">
  <b>⚠️ No Google Credentials Required</b>
  <img src="https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif" width="35">
</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Google%20Credentials-NOT%20REQUIRED-success?style=for-the-badge&logo=google&logoColor=white" alt="No Google Credentials">
</p>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

</div>

---

<!-- Table of Contents with Icons -->
## 📑 Table of Contents

<details open>
<summary>Click to expand/collapse</summary>

- [📝 **Note**](#-note)
- [🚧 **Requirements**](#-requirements)
- [📖 **Tutorial**](#-tutorial)
- [💡 **How It Works**](#-how-it-works)
- [🔔 **Update Notifications**](#-update-notifications)
- [🆙 **How to Update**](#-how-to-update)
- [🛠️ **Creating Commands**](#️-creating-commands)
- [💭 **Support**](#-support)
- [🌐 **Supported Languages**](#-supported-languages)
- [⚠️ **Common Problems**](#️-common-problems)
- [❌ **Warning: Official Source Only**](#-warning-official-source-only)
- [📸 **Screenshots**](#-screenshots)
- [✨ **Copyright**](#-copyright)
- [📜 **License**](#-license)

</details>

---

## 📝 Note

<div align="center">

⚠️ **Important Security Information** ⚠️

</div>

- This is a **Messenger chat bot** using a **personal account** with an [unofficial API](https://github.com/ntkhang03/fb-chat-api/blob/master/DOCS.md) ([Original API](https://github.com/Schmavery/facebook-chat-api))
- Using this bot **may result** in your Facebook account being locked due to spam or other violations
- 🎭 **Recommendation:** Use a clone/throwaway account that you're willing to lose
- ⚠️ **Disclaimer:** I am **NOT responsible** for any issues arising from using this bot

---

## 🚧 Requirements

<div align="center">

| Requirement | Details |
|------------|---------|
| 🟢 **Node.js** | Version 16.x ([Download](https://nodejs.org/dist/v16.20.0) \| [Home](https://nodejs.org/en/download/) \| [Other Versions](https://nodejs.org/en/download/releases/)) |
| 💻 **Knowledge** | JavaScript, Node.js, Unofficial Facebook API |
| ✅ **Google Credentials** | **NOT REQUIRED** - No setup needed! |

</div>

---

## 📖 Tutorial

<div align="center">

### 📱 Video Tutorials

| Platform | Link |
|----------|------|
| 📱 **Mobile Setup** | [Watch Tutorial](https://www.youtube.com/watch?v=grVeZ76HlgA) |
| 💻 **VPS/Windows Setup** | [Watch Tutorial](https://www.youtube.com/watch?v=uCbSYNQNEwY) |
| 📄 **Written Guide** | [Read Instructions](https://github.com/ntkhang03/Goat-Bot-V2/blob/main/STEP_INSTALL.md) |

</div>

---

## 💡 How It Works

<details>
<summary><b>Click to expand architecture overview</b></summary>

### 🔄 Event Flow

The bot uses the **unofficial Facebook API** to send and receive messages. When a new event occurs (message, reaction, user join/leave, etc.), the bot processes it through handlers:

#### **🎯 onStart Handler**
1. ✅ Checks if user called a command
2. 🚫 Validates user ban status and admin-only mode
3. 🔐 Verifies user permissions
4. ⏱️ Checks command cooldown
5. ▶️ Executes command and logs to console

#### **💬 onChat Handler**
- Triggered when user sends a message
- Checks permissions
- Executes command or async function
- Logs activity

#### **🎭 onFirstChat Handler**
- Runs on first message from chat since bot started
- Works like `onChat`

#### **😀 onReaction Handler**
- Triggered when user reacts to specific messages
- Uses `GoatBot.onReaction` map system
- Auto-adds delete method
- Permission-checked execution

#### **↩️ onReply Handler**
- Activated when user replies to tracked messages
- Uses `GoatBot.onReply` map system
- Auto-cleanup available
- Permission-validated

#### **🎪 onEvent Handler**
- Handles Facebook events (join, leave, admin changes)
- Loops through registered event commands
- Executes callbacks

#### **🎬 handlerEvent**
- Processes all event-type activities
- Runs commands from `scripts/events` folder
- Async function support

</details>

---

## 🔔 Update Notifications

Want to stay updated with the latest features?

1. Click the **⭐ Watch** button (top-right corner)
2. Select **Custom**
3. Enable **Pull Requests** and **Releases**
4. Click **Apply**

🎉 You'll now receive notifications for all updates!

---

## 🆙 How to Update

<div align="center">

| Platform | Tutorial Link |
|----------|--------------|
| 📱 **Mobile/Replit** | [Watch at 22:22](https://youtu.be/grVeZ76HlgA?t=1342) |
| 💻 **VPS/Computer** | [Watch at 8:28](https://youtu.be/uCbSYNQNEwY?t=508) |

</div>

---

## 🛠️ Creating Commands

Want to create your own custom commands? 

📚 **[Read the Complete Guide Here](https://github.com/ntkhang03/Goat-Bot-V2/blob/main/DOCS.md)**

---

## 💭 Support

<div align="center">

Need help? Join our community!

| Platform | Link | Status |
|----------|------|--------|
| 💬 **Discord** | [Join Server](https://discord.com/invite/DbyGwmkpVY) | ✅ **Recommended** |
| 📘 **Facebook Group** | [Join Group](https://www.facebook.com/groups/goatbot) | ✅ Active |
| 💬 **Messenger** | [Join Chat](https://m.me/j/Abbq0B-nmkGJUl2C) | ✅ Active |
| 📱 **Telegram** | ~~Old Link~~ | ❌ No Longer Supported |

</div>

> ⚠️ **Please do NOT inbox me directly.** I do not respond to private messages. All questions should be asked in the community groups. Thank you!

---

## 🌐 Supported Languages

The bot currently supports **2 languages**:

- ✅ **English** (`en`)
- ✅ **Vietnamese** (`vi`)

### 🔧 Customization

- Change language in `config.json`
- Customize translations in:
  - `languages/`
  - `languages/cmds/`
  - `languages/events/`

---

## ⚠️ Common Problems

<details>
<summary><b>📌 Error 400: redirect_uri_mismatch</b></summary>

<p align="center">
  <img src="https://i.ibb.co/6Fbjd4r/image.png" width="250px">
</p>

**Solutions:**
1. Enable Google Drive API: [Tutorial](https://youtu.be/nTIT8OQeRnY?t=347)
2. Add URI `https://developers.google.com/oauthplayground` (NOT `https://developers.google.com/oauthplayground/`) to **Authorized redirect URIs**: [Tutorial](https://youtu.be/nTIT8OQeRnY?t=491)
3. Choose `https://www.googleapis.com/auth/drive` and `https://mail.google.com/` in OAuth 2.0 Playground: [Tutorial](https://youtu.be/nTIT8OQeRnY?t=600)

</details>

<details>
<summary><b>📌 Error: Invalid domain for site key</b></summary>

<p align="center">
  <img src="https://i.ibb.co/2gZttY7/image.png" width="250px">
</p>

**Solutions:**
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Add domain **repl.co** (NOT **repl.com**) to **Domains** in reCAPTCHA v2: [Tutorial](https://youtu.be/nTIT8OQeRnY?t=698)

</details>

<details>
<summary><b>📌 GaxiosError: invalid_grant, unauthorized_client</b></summary>

<p align="center">
  <img src="https://i.ibb.co/n7w9TkH/image.png" width="250px">
  <br>
  <img src="https://i.ibb.co/XFKKY9c/image.png" width="250px">
  <br>
  <img src="https://i.ibb.co/f4mc5Dp/image.png" width="250px">
</p>

**Solution:**
- If you don't publish the project in Google Console, the refresh token expires after **1 week**
- You'll need to get a new token: [Tutorial](https://youtu.be/nTIT8OQeRnY?t=445)

</details>

<details>
<summary><b>📌 GaxiosError: invalid_client</b></summary>

<p align="center">
  <img src="https://i.ibb.co/st3W6v4/Pics-Art-01-01-09-10-49.jpg" width="250px">
</p>

**Solution:**
- Verify you entered your Google Project `client_id` correctly: [Tutorial](https://youtu.be/nTIT8OQeRnY?t=509)

</details>

<details>
<summary><b>📌 Error 403: access_denied</b></summary>

<p align="center">
  <img src="https://i.ibb.co/dtrw5x3/image.png" width="250px">
</p>

**Solution:**
- If you don't publish the project, only approved accounts can use it
- Add test users or publish your app: [Tutorial](https://youtu.be/nTIT8OQeRnY?t=438)

</details>

---

## ❌ Warning: Official Source Only

<div align="center">

### ⚠️ **DANGER: Fake/Unofficial Sources** ⚠️

</div>

- ❌ Unknown source code can contain **viruses, malware, and exploits**
- ❌ May lead to **hacked accounts** (social media, banking)
- ✅ **Official Source Only:** https://github.com/ntkhang03/Goat-Bot-V2
- ❌ All forks, copies, and versions from other sources are **FAKE and UNSAFE**
- 🚫 Using unofficial sources **violates our policy** and will result in a **ban without notice**

---

## 📸 Screenshots

<div align="center">

### 🤖 Bot Features

</div>

<details>
<summary><b>🏆 Rank System</b></summary>

**Rank Card:**
<p align="center">
  <img src="https://i.ibb.co/d0JDJxF/rank.png" width="399px">
</p>

**Rankup Notification:**
<p align="center">
  <img src="https://i.ibb.co/WgZzthH/rankup.png" width="399px">
</p>

**Custom Rank Card:**
<p align="center">
  <img src="https://i.ibb.co/hLTThLW/customrankcard.png" width="399px">
</p>

</details>

<details>
<summary><b>🌤️ Weather</b></summary>

<p align="center">
  <img src="https://i.ibb.co/2FwWVLv/weather.png" width="399px">
</p>

</details>

<details>
<summary><b>👋 Welcome/Goodbye Messages</b></summary>

<p align="center">
  <img src="https://i.ibb.co/Jsb5Jxf/wcgb.png" width="399px">
</p>

Auto-send notifications when users join or leave (fully customizable!)

</details>

<details>
<summary><b>🎨 Openjourney</b></summary>

<p align="center">
  <img src="https://i.ibb.co/XJfwj1X/Screenshot-2023-05-09-22-43-58-630-com-facebook-orca.jpg" width="399px">
</p>

</details>

<details>
<summary><b>🤖 GPT Integration</b></summary>

<p align="center">
  <img src="https://i.ibb.co/D4wRbM3/Screenshot-2023-05-09-22-47-48-037-com-facebook-orca.jpg" width="399px">
  <br><br>
  <img src="https://i.ibb.co/z8HqPkH/Screenshot-2023-05-09-22-47-53-737-com-facebook-orca.jpg" width="399px">
  <br><br>
  <img src="https://i.ibb.co/19mZQpR/Screenshot-2023-05-09-22-48-02-516-com-facebook-orca.jpg" width="399px">
</p>

</details>

---

## ✨ Copyright

<div align="center">

**Created with ❤️ by [NTKhang (NTKhang03)](https://github.com/ntkhang03)**

**Enhanced by [NeoKEX](https://github.com/NeoKEX)**

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

</div>

---

## 📜 License

### 🇻🇳 VIETNAMESE

**Nếu bạn vi phạm bất kỳ quy tắc nào, bạn sẽ bị cấm sử dụng dự án của tôi**

- ❌ Không bán mã nguồn của tôi
- ❌ Không tự xưng là chủ sở hữu của mã nguồn
- ❌ Không kiếm tiền từ mã nguồn (mua bán lệnh, bot, quyên góp, etc.)
- ❌ Không xóa/sửa đổi credit (tên tác giả)

### 🇺🇸 ENGLISH

**If you violate any rules, you will be banned from using my project**

- ❌ Don't sell my source code
- ❌ Don't claim my source code as your own
- ❌ Don't monetize my source code (buying/selling commands, bots, donations, etc.)
- ❌ Don't remove/edit credits (author name)

---

<div align="center">

<!-- Animated Footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%"/>

**Made with 💖 by [NTKhang](https://github.com/ntkhang03) | Enhanced by [NeoKEX](https://github.com/NeoKEX)**

<p>
  <img src="https://img.shields.io/github/stars/ntkhang03/Goat-Bot-V2?style=social" alt="Stars">
  <img src="https://img.shields.io/github/forks/ntkhang03/Goat-Bot-V2?style=social" alt="Forks">
  <img src="https://img.shields.io/github/watchers/ntkhang03/Goat-Bot-V2?style=social" alt="Watchers">
</p>

**⭐ If you like this project, give it a star! ⭐**

</div>
