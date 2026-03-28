# ✨ Enhanced Features Guide

This document explains all the new features added to this enhanced version of Goat Bot V2.

## 🎭 Advanced Role System

### Role Levels
- **Role 0**: Regular users
- **Role 1**: Group administrators
- **Role 2**: Bot administrators
- **Role 3**: Premium users
- **Role 4**: Bot developers (highest permission)

### Managing Roles

#### Admin Role (Role 2)
```
-admin add @user
-admin remove @user
-admin list
```

#### Premium Role (Role 3)
```
-premium add @user
-premium remove @user
-premium list
```

#### Developer Role (Role 4)
```
-dev add @user
-dev remove @user
-dev list
```

## 💰 Money-Based Command Access

### How It Works
Commands can now require a minimum balance to use. This is **independent** of role requirements.

### Setting Up Money Requirements
In your command file:
```javascript
module.exports = {
        config: {
                name: "mycommand",
                role: 0,                    // Anyone can use IF they have enough money
                requiredMoney: 5000,        // Requires $5000 balance
                // ... other config
        },
        // ... rest of command
};
```

### Example Commands

**Demo Command** (`demo.js`):
- Available to all users (role: 0)
- Requires $1000 balance (requiredMoney: 1000)
- Perfect for testing the money requirement system
- Try it: `-demo` or `-moneydemo`

**VIP Command** (`vip.js`):
- Available to all users (role: 0)
- Requires $5000 balance (requiredMoney: 5000)
- Shows premium user information
- Users see their balance and required amount if they don't have enough

### How Users Get Money
Users earn money through:
- Daily rewards (`-daily`)
- Playing games (`-guessnumber`)
- Other economy commands in your bot

## 🤖 Smart Command Suggestions

### Auto-Correction
When users type a wrong command, the bot suggests the closest match:

**Example:**
```
User: -hlep
Bot: Command "hlep" not found.

Did you mean: -help?
```

### Prefix-Only Detection
If users type just the prefix:
```
User: -
Bot: That's just the bot prefix. Try typing -help to see available commands.
```

### How It Works
- Uses Levenshtein distance algorithm
- Checks against all commands and aliases
- Suggests matches within 3 character differences
- Smart and helpful for new users!

## 😡 React to Delete

### Admin/Developer Power
Admins (role 2+) and Developers (role 4) can delete bot messages by reacting with angry emojis:

**Supported Reactions:**
- 😡 (angry face)
- 😠 (pouting face)

**How It Works:**
1. Bot sends a message
2. Admin/Developer reacts with 😡 or 😠
3. Bot immediately deletes that message
4. Works only on bot's own messages with tracked reactions

**Security:**
- Only works on messages the bot sent
- Only for users with role 2 or higher
- Cannot delete arbitrary messages

## 🛠️ Developer Tools

### Shell Command (Role 4 Only)
Execute shell commands directly from chat:
```
-shell ls -la
-shell node -v
-shell npm list
```

**Features:**
- 30-second timeout
- Output truncated at 2000 characters
- Error handling with clear messages
- **Security**: Only role 4 users can access

### Eval Command (Already Included)
Execute JavaScript code (role 2+ required)

## 🎨 Icon System

All emojis have been replaced with clean Unicode icons:
- ✅ → ✓
- ❌ → ✗
- ⚠️ → ⚠
- 📝 → ✎
- 👑 → ♔
- 🎉 → ★

**Benefits:**
- Cleaner appearance
- Better compatibility
- Professional look
- Consistent styling

## 📊 Command Configuration Reference

### Full Command Config Example
```javascript
module.exports = {
        config: {
                name: "mycommand",
                aliases: ["alias1", "alias2"],
                version: "1.0",
                author: "YourName",
                countDown: 5,              // Cooldown in seconds
                role: 0,                   // Required role (0-4)
                requiredMoney: 1000,       // Required money (OPTIONAL)
                description: {
                        vi: "Mô tả tiếng Việt",
                        en: "English description"
                },
                category: "economy",
                guide: {
                        vi: "Hướng dẫn tiếng Việt",
                        en: "English guide"
                }
        },

        langs: {
                vi: {
                        success: "✓ Thành công! Số dư: $%1"
                },
                en: {
                        success: "✓ Success! Balance: $%1"
                }
        },

        onStart: async function ({ message, args, usersData, event, getLang, api }) {
                // Get user data to access balance
                const userData = await usersData.get(event.senderID);
                const userMoney = userData.data.money || 0;
                
                // Your command logic here
                return message.reply(getLang("success", userMoney));
        }
};
```

### Real Example: Demo Command
```javascript
module.exports = {
        config: {
                name: "demo",
                role: 0,                    // Anyone can use
                requiredMoney: 1000,        // But needs $1000
                // ... other config
        },
        
        onStart: async function ({ message, usersData, event, getLang }) {
                const userData = await usersData.get(event.senderID);
                const userMoney = userData.data.money || 0;
                
                return message.reply(getLang("success", userMoney));
        }
};
```
See `scripts/cmds/demo.js` for the complete code.

## 🔐 Permission Hierarchy

### Role-Based Commands
```javascript
role: 0  // Everyone
role: 1  // Group admins
role: 2  // Bot admins
role: 3  // Premium users
role: 4  // Developers
```

### Money-Based Commands
```javascript
requiredMoney: 1000   // Requires $1000
requiredMoney: 5000   // Requires $5000
requiredMoney: 10000  // Requires $10000
```

### Combined Requirements
```javascript
role: 2,              // Must be bot admin
requiredMoney: 5000   // AND have $5000
```

## 📈 Best Practices

### For Bot Admins
1. **Protect developer role**: Only give role 4 to trusted people
2. **Use premium wisely**: Don't make all commands premium-only
3. **Set reasonable money requirements**: Don't make it impossible to earn
4. **Monitor shell command usage**: Check logs regularly

### For Developers
1. **Test commands thoroughly**: Use role 0 for testing
2. **Add clear descriptions**: Help users understand commands
3. **Use icons consistently**: Follow the icon mapping
4. **Set appropriate cooldowns**: Prevent spam

### For Users
1. **Check command requirements**: Use `-help <command>` to see requirements
2. **Earn money regularly**: Use `-daily` and play games
3. **Report issues**: Help improve the bot

## 🎯 Tips & Tricks

### Economy Management
- Set up regular income sources for users
- Balance money requirements with earning potential
- Consider adding money transfer commands
- Track user balances with admin commands

### Role Management
- Keep role 4 limited to developers only
- Use role 3 for special users or supporters
- Role 2 for trusted moderators
- Roles are hierarchical (higher includes lower permissions)

### Command Organization
- Use categories to group related commands
- Keep descriptions clear and concise
- Add aliases for commonly misspelled commands
- Set appropriate cooldowns

---

**Created by NTKhang | Enhanced by NeoKEX**