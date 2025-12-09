<div align="center">
  <img src="https://i.ibb.co/RQ28H2p/banner.png" alt="banner" width="100%">
  
  <h1>
    <img src="./dashboard/images/logo-non-bg.png" width="30px" style="vertical-align: middle">
    Goat Bot V2 - Enhanced Facebook Messenger Bot
  </h1>
  
  <p>
    <a href="https://nodejs.org/dist/v20.0.0">
      <img src="https://img.shields.io/badge/Node.js-20.x-brightgreen.svg?style=for-the-badge&logo=node.js" alt="Node.js v20.x">
    </a>
    <img src="https://img.shields.io/github/repo-size/ntkhang03/Goat-Bot-V2.svg?style=for-the-badge&label=size&color=blue" alt="Repo Size">
    <img src="https://img.shields.io/badge/dynamic/json?color=orange&label=version&prefix=v&query=%24.version&url=https://github.com/ntkhang03/Goat-Bot-V2/raw/main/package.json&style=for-the-badge" alt="Version">
    <img src="https://visitor-badge.laobi.icu/badge?style=for-the-badge&page_id=ntkhang3.Goat-Bot-V2&color=red" alt="Visitors">
    <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  </p>
  
  <h3>✨ Created by <a href="https://github.com/ntkhang03">NTKhang</a> | Modified & Enhanced by <a href="https://github.com/NeoKEX">NeoKEX</a></h3>
  
  <p>
    <strong>🚀 No Google Credentials Required!</strong><br>
    <em>Uses neokex-fca for seamless Facebook integration</em>
  </p>
</div>

<br>

<div align="center">
  
  ### 🌟 Key Features
  
  | Feature | Description |
  |---------|-------------|
  | 🔐 **No Google Auth** | No need for Google API credentials or complex OAuth setup |
  | ⚡ **Fast & Lightweight** | Built on unofficial Facebook API for optimal performance |
  | 🎭 **Role-Based Access** | 5-tier permission system (User → Group Admin → Bot Admin → Premium → Developer) |
  | 💰 **Premium System** | Money-based premium features for advanced commands |
  | 🛡️ **Developer Tools** | Built-in shell & eval for developers (role 4) |
  | 🎯 **Smart Commands** | Auto-suggestion for typos & helpful hints |
  | ☁️ **Deploy Anywhere** | Ready for Render, Railway, Replit, VPS, and more |
  
</div>

- [📝 **Note**](#-note)
- [🚧 **Requirement**](#-requirement)
- [📝 **Tutorial**](#-tutorial)
- [💡 **How it works?**](#-how-it-works)
- [🔔 **How to get notification when have new update?**](#-how-to-get-notification-when-have-new-update)
- [🆙 **How to Update**](#-how-to-update)
- [🛠️ **How to create new commands**](#️-how-to-create-new-commands)
- [💭 **Support**](#-support)
- [📚 **Support Languages in source code**](#-support-languages-in-source-code)
- [📌 **Common Problems**](#-common-problems)
- [❌ **DO NOT USE THE ORIGINAL UNDERGRADUATE VERSION**](#-do-not-use-the-original-undergraduate-version)
- [📸 **Screenshots**](#-screenshots)
- [✨ **Copyright (C)**](#-copyright-c)
- [📜 **License**](#-license)

<hr>

## 📝 **Important Notes**

> ⚠️ **Account Safety First**
> - This bot uses [neokex-fca](https://github.com/NeoKEX/neokex-fca) (Facebook Chat API)
> - **No Google API credentials needed** - Simple setup with just your Facebook account
> - Using unofficial APIs may risk account restrictions
> - **Recommended:** Use a secondary/clone Facebook account
> - The developers are not responsible for any account issues

### ✨ **What's New in this Enhanced Version**
- 🎖️ **Advanced Role System**: 5 permission levels (0-4) for granular access control
- 💎 **Premium Users** (Role 3): Money-based premium features
- 👨‍💻 **Developers** (Role 4): Full system access with shell & eval commands
- 🤖 **Smart Command Suggestions**: Typo detection with closest match suggestions
- 😡 **React to Delete**: Admins/Devs can react with 😡/😠 to unsend bot messages
- ☁️ **Deploy Ready**: Pre-configured for Render, Railway & more
- 🎨 **Clean Icons**: Replaced emoji clutter with elegant Unicode icons

## 🚧 **Requirements**
- Node.js 16.x or 20.x [Download](https://nodejs.org/dist/v20.0.0) | [Home](https://nodejs.org/en/download/)
- Basic knowledge of JavaScript/Node.js (optional but helpful)
- A secondary/clone Facebook account (recommended)
- **No Google API credentials required!**

## 📝 **Installation & Deployment**

### 🚀 Quick Start (Local)
```bash
git clone https://github.com/ntkhang03/Goat-Bot-V2.git
cd Goat-Bot-V2
npm install
```
Configure `config.json` with your Facebook credentials, then:
```bash
npm start
```

### ☁️ Cloud Deployment
Choose your preferred platform:
- **[Render](DEPLOY.md#render)** - Free tier available, auto-deploy from GitHub
- **[Railway](DEPLOY.md#railway)** - $5/month free credit, excellent for 24/7 bots
- **[Replit](DEPLOY.md#replit)** - Quick setup, perfect for testing
- **[VPS/Server](DEPLOY.md#vpsserver)** - Full control, use PM2 for process management

📘 **Detailed deployment guide**: See [DEPLOY.md](DEPLOY.md)

### 📺 Video Tutorials
- For mobile phone: https://www.youtube.com/watch?v=grVeZ76HlgA
- For VPS/Windows: https://www.youtube.com/watch?v=uCbSYNQNEwY
  
Summary instructions:
- See [here](https://github.com/ntkhang03/Goat-Bot-V2/blob/main/STEP_INSTALL.md)



## 💡 **How it works?**
- The bot uses the unofficial facebook api to send and receive messages from the user.
- When having a `new event` (message, reaction, new user join, user leave chat box,...) the bot will emit an event to the `handlerEvents`.
- The `handlerEvents` will handle the event and execute the command:
  - `onStart`:
    - the handler will check if user `call a command or not`.
    - if yes, it will check if `user banned` or mode `admin box only is turned on` or not, if not, it will execute the command.
    - next, it will check the `permission` of the user.
    - next, it will check if the `countdown` of command is over or not.
    - finally, it will execute the command and `log` information to the console.

  - `onChat`:
    - the handler will run `when the user sends a message`.
    - it will check `permission` of the user.
    - the handler will `execute` the command, if it return a `function` or `async function` then it willl check `user banned` or mode `admin box only is turned on` or not, if not, it will call the function and `log` information to the console.

  - `onFirstChat`:
    - the handler will run `when get the first message` from the chat box since the bot started.
    - the way it works is like `onChat`.

  - `onReaction`:
    - the handler will run when the user `reacts` to a `message has messageID` is set in `GoatBot.onReaction` as follows:
                ```javascript
                // example:     
                global.GoatBot.onReaction.set(msg.messageID, {
                        messageID: msg.messageID,
                        commandName,
                        // ... and more
                });
                ```
    - the handler will automatically add method `delete`, if this method is called, it will delete the message from the set.
    - next, it will check `permission` of the user and `execute` if the user has permission and `log` information to the console.

  - `onReply`:
    - the handler will run when the user `replies` to a `message has messageID` is set in `GoatBot.onReply` as follows:
                ```javascript
                // example:
                global.GoatBot.onReply.set(msg.messageID, {
                        messageID: msg.messageID,
                        commandName,
                        // ... and more
                });
                ```
    - the handler will automatically add method `delete`, if this method is called, it will delete the message from the set.
    - next, it will check `permission` of the user and `execute` if the user has permission and `log` information to the console.  

  - `onEvent`:
    - the handler will run `when the user has a new event` type `event` (new user join, user leave chat box, change admin box,...)
                ```javascript
                // example:
                global.GoatBot.onEvent.set(msg.messageID, {
                        messageID: msg.messageID,
                        commandName,
                        // ... and more
                });
                ```
                - it will loop through all `onEvent` and get the command determined by the key `commandName` and execute the `onEvent` in that command.
                - if it return a `function` or `async function` then it will call the function and `log` information to the console.

  - `handlerEvent`:
    - the handler will run `when the user has a new event` type `event` (new user join, user leave chat box, change admin box,...)
    - it will get all the eventCommand set in `GoatBot.eventCommands` (scripts placed in the `scripts/events` folder)
    - it will loop through all `eventCommands` and run the `onStart` in that command.
    - if it return a `function` or `async function` then it will call the function and `log` information to the console.


## 🔔 **How to get notification when have new update?**
- Click on the `Watch` button in the upper right corner of the screen and select `Custom` and select `Pull requests` and `Releases` and click `Apply` to get notified when there is a new update.

## 🆙 **How to Update**
Tutorial has been uploaded on YouTube
- on phone/repl: https://youtu.be/grVeZ76HlgA?t=1342
- on vps/computer: https://youtu.be/uCbSYNQNEwY?t=508

## 🛠️ **How to create new commands**
- See [here](https://github.com/ntkhang03/Goat-Bot-V2/blob/main/DOCS.md)

## 💭 **Support**
If you have major coding issues with this bot, please join and ask for help.
- https://discord.com/invite/DbyGwmkpVY (recommended)
- https://www.facebook.com/groups/goatbot
- https://m.me/j/Abbq0B-nmkGJUl2C
- ~~https://t.me/gatbottt~~ (no longer supported)
- ***Please do not inbox me, I do not respond to private messages, any questions please join the chat group for answers. ThankThanks!***

## 📚 **Support Languages in source code**
- Currently, the bot supports 2 languages:
- [x] `en: English`
- [x] `vi: Vietnamese`

- Change language in `config.json` file
- You can customize the language in the folder `languages/`, `languages/cmds/` and `languages/events/`

## 📌 **Common Problems**
<details>
        <summary>
                📌 Error 400: redirect_uri_mismatch
        </summary>
        <p><img src="https://i.ibb.co/6Fbjd4r/image.png" width="250px"></p> 
        <p>1. Enable Google Drive API: <a href="https://youtu.be/nTIT8OQeRnY?t=347">Tutorial</a></p>
        <p>2. Add uri <a href="https://developers.google.com/oauthplayground">https://developers.google.com/oauthplayground</a> (not <a href="https://developers.google.com/oauthplayground/">https://developers.google.com/oauthplayground/</a>) to <b>Authorized redirect URIs</b> in <b>OAuth consent screen:</b> <a href="https://youtu.be/nTIT8OQeRnY?t=491">Tutorial</a></p>  
        <p>3. Choose <b>https://www.googleapis.com/auth/drive</b> and <b>https://mail.google.com/</b> in <b>OAuth 2.0 Playground</b>: <a href="https://youtu.be/nTIT8OQeRnY?t=600">Tutorial</a></p>
</details>

<details>
        <summary>
                📌 Error for site owners: Invalid domain for site key
        </summary>
                <p><img src="https://i.ibb.co/2gZttY7/image.png" width="250px"></p>
                <p>1. Go to <a href="https://www.google.com/recaptcha/admin">https://www.google.com/recaptcha/admin</a></p>
                <p>2. Add domain <b>repl.co</b> (not <b>repl.com</b>) to <b>Domains</b> in <b>reCAPTCHA v2</b> <a href="https://youtu.be/nTIT8OQeRnY?t=698">Tutorial</a></p>
</details>

<details>
        <summary>
                📌 GaxiosError: invalid_grant, unauthorized_client 
        </summary>
                <p><img src="https://i.ibb.co/n7w9TkH/image.png" width="250px"></p>
                <p><img src="https://i.ibb.co/XFKKY9c/image.png" width="250px"></p>
                <p><img src="https://i.ibb.co/f4mc5Dp/image.png" width="250px"></p>
                <p>- If you don't publish the project in google console, the refresh token will expire after 1 week and you need to get it back. <a href="https://youtu.be/nTIT8OQeRnY?t=445">Tuatorial</a></p>
</details>

<details>
        <summary>
                📌 GaxiosError: invalid_client
        </summary>
                <p><img src="https://i.ibb.co/st3W6v4/Pics-Art-01-01-09-10-49.jpg" width="250px"></p>
                <p>- Check if you have entered your google project client_id correctly <a href="https://youtu.be/nTIT8OQeRnY?t=509">Tuatorial</a></p>
</details>

<details>
        <summary>
                📌 Error 403: access_denied
        </summary>
                <p><img src="https://i.ibb.co/dtrw5x3/image.png" width="250px"></p>
                <p>- If you don't publish the project in google console only the approved accounts added to the project can use it <a href="https://youtu.be/nTIT8OQeRnY?t=438">Tuatorial</a></p>
</details>

## ❌ **DO NOT USE THE ORIGINAL UNDERGRADUATE VERSION**
- The use of unknown source code can lead to the device being infected with viruses, malware, hacked social accounts, banks, ...
- Goat-Bot-V2 is only published at https://github.com/ntkhang03/Goat-Bot-V2, all other sources, all forks from other github, replit,... are fake, violate policy
- If you use from other sources (whether accidentally or intentionally) it means that you are in violation and will be banned without notice
## 📸 **Screenshots**
- ### Bot
<details>
        <summary>
                Rank system
        </summary>

  - Rank card:
  <p><img src="https://i.ibb.co/d0JDJxF/rank.png" width="399px"></p>

  - Rankup notification:
  <p><img src="https://i.ibb.co/WgZzthH/rankup.png" width="399px"></p>

  - Custom rank card:
  <p><img src="https://i.ibb.co/hLTThLW/customrankcard.png" width="399px"></p>
</details>

<details>
        <summary>
                Weather
        </summary>
        <p><img src="https://i.ibb.co/2FwWVLv/weather.png" width="399px"></p>
</details>

<details>
        <summary>
                Auto send notification when have user join or leave box chat (you can custom message)
        </summary>
        <p><img src="https://i.ibb.co/Jsb5Jxf/wcgb.png" width="399px"></p>
</details>

<details>
        <summary>
                Openjourney
        </summary>
        <p><img src="https://i.ibb.co/XJfwj1X/Screenshot-2023-05-09-22-43-58-630-com-facebook-orca.jpg" width="399px"></p>
</details>

<details>
        <summary>
                GPT
        </summary>
        <p><img src="https://i.ibb.co/D4wRbM3/Screenshot-2023-05-09-22-47-48-037-com-facebook-orca.jpg" width="399px"></p>
        <p><img src="https://i.ibb.co/z8HqPkH/Screenshot-2023-05-09-22-47-53-737-com-facebook-orca.jpg" width="399px"></p>
        <p><img src="https://i.ibb.co/19mZQpR/Screenshot-2023-05-09-22-48-02-516-com-facebook-orca.jpg" width="399px"></p>
</details>



- ### Dashboard
<details>
        <summary>
                Home:
        </summary>
        <p><img src="https://i.postimg.cc/GtwP4Cqm/Screenshot-2023-12-23-105357.png" width="399px"></p>
        <p><img src="https://i.postimg.cc/MTjbZT0L/Screenshot-2023-12-23-105554.png" width="399px"></p>
</details>

<details>
        <summary>
                Stats:
        </summary>
        <p><img src="https://i.postimg.cc/QtXt98B7/image.png" width="399px"></p>
</details>

<details>
        <summary>
                Login/Register:
        </summary>
        <p><img src="https://i.postimg.cc/Jh05gKsM/Screenshot-2023-12-23-105743.png" width="399px"></p>
        <p><img src="https://i.postimg.cc/j5nM9K8m/Screenshot-2023-12-23-105748.png" width="399px"></p>
</details>

<details>
        <summary>
                Dashboard Thread:
        </summary>
        <p><img src="https://i.postimg.cc/RF237v1Z/Screenshot-2023-12-23-105913.png" width="399px"></p>
</details>

<details>
        <summary>
                Custom on/off:
        </summary>
        <p><img src="https://i.ibb.co/McDRhmX/image.png" width="399px"></p>
</details>

<details>
        <summary>
                Custom welcome message (similar with leave, rankup (coming soon), custom command (coming soon))
        </summary>
        <p><img src="https://i.ibb.co/6ZrQqc1/image.png" width="399px"></p>
        <p><img src="https://i.ibb.co/G53JsXm/image.png" width="399px"></p>
</details>

## ✨ **Copyright (C)**
- **[NTKhang (NTKhang03)](https://github.com/ntkhang03)**

## 📜 **License**

**VIETNAMESE**

- ***Nếu bạn vi phạm bất kỳ quy tắc nào, bạn sẽ bị cấm sử dụng dự án của tôi***
- Không bán mã nguồn của tôi
- Không tự xưng là chủ sở hữu của mã nguồn của tôi
- Không kiếm tiền từ mã nguồn của tôi (chẳng hạn như: mua bán lệnh, mua bán/cho thuê bot, kêu gọi quyên góp, v.v.)
- Không xóa/sửa đổi credit (tên tác giả) trong mã nguồn của tôi

**ENGLISH**

- ***If you violate any rules, you will be banned from using my project***
- Don't sell my source code
- Don't claim my source code as your own
- Do not monetize my source code (such as: buy and sell commands, buy and sell bots, call for donations, etc.)
- Don't remove/edit my credits (author name) in my source code

