const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TASK_JSON = path.join(__dirname, "cache/midj_tasks.json");
const USAGE_LOG = path.join(__dirname, "cache/midj_usage.json");
if (!fs.existsSync(TASK_JSON)) fs.writeFileSync(TASK_JSON, "{}");
if (!fs.existsSync(USAGE_LOG)) fs.writeFileSync(USAGE_LOG, "{}");

module.exports = {
  config: {
    name: "midjourney3",
    aliases: ["mj3"],
    author: "Easir bal bal iqbal høpéléss mâgî--",
    version: "1.0",
    role: 0,
    description: {
      en: "Generate image using MidJourney-style API with optional reference image"
    },
    category: "ai-generated",
    guide: "{pn} <prompt> [--cref <image_url>] [--sref <image_url>] [--ar <ratio>]"
  },

  onStart: async function ({ args, message, event }) {
    try {
      const adminUID = "61568425442088";
      const senderID = event.senderID;
      const isAdmin = senderID === adminUID;
      
      // Check usage limits for non-admin users
      if (!isAdmin) {
        const now = Date.now();
        const usageData = JSON.parse(fs.readFileSync(USAGE_LOG, "utf8")) || {};
        const userUsage = usageData[senderID] || { count: 0, lastUsed: 0 };
        
        // Check daily limit (5 uses per day)
        if (userUsage.count >= 5) {
          const lastUsedDate = new Date(userUsage.lastUsed);
          const currentDate = new Date();
          
          // Reset count if it's a new day
          if (lastUsedDate.getDate() !== currentDate.getDate() || 
              lastUsedDate.getMonth() !== currentDate.getMonth() || 
              lastUsedDate.getFullYear() !== currentDate.getFullYear()) {
            userUsage.count = 0;
          } else {
            return message.reply("❌ You've reached your daily limit of 5 MidJourney generations. Please try again tomorrow.");
          }
        }
        
        // Check cooldown (5 minutes)
        const cooldown = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (now - userUsage.lastUsed < cooldown) {
          const remainingTime = Math.ceil((cooldown - (now - userUsage.lastUsed)) / 1000 / 60);
          return message.reply(`⏳ Please wait ${remainingTime} more minute(s) before using this command again.`);
        }
        
        // Update usage data
        userUsage.count += 1;
        userUsage.lastUsed = now;
        usageData[senderID] = userUsage;
        fs.writeFileSync(USAGE_LOG, JSON.stringify(usageData, null, 2));
      }

      // Parse arguments
      let prompt = "";
      let cref = "";
      let sref = "";
      let ratio = "1:1";
      
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "--cref" && i + 1 < args.length) {
          cref = args[i + 1];
          i++;
        } else if (args[i] === "--sref" && i + 1 < args.length) {
          sref = args[i + 1];
          i++;
        } else if (args[i] === "--ar" && i + 1 < args.length) {
          ratio = args[i + 1];
          i++;
        } else {
          prompt += args[i] + " ";
        }
      }

      prompt = prompt.trim();
      
      // Handle image reply for cref
      if (event.type === "message_reply" && 
          event.messageReply.attachments?.length > 0) {
        const imageAttachment = event.messageReply.attachments.find(
          att => ["photo", "image"].includes(att?.type)
        );
        if (imageAttachment) {
          cref = imageAttachment.url;
        }
      }

      if (!prompt) return message.reply("⚠️ Please provide a prompt.");

      // Build API URL
      let apiUrl = `https://egret-driving-cattle.ngrok-free.app/api/midjourney?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`;
      if (cref) apiUrl += `&cref=${encodeURIComponent(cref)}`;
      if (sref) apiUrl += `&sref=${encodeURIComponent(sref)}`;

      const processingMsg = await message.reply("🔄 Generating your image...");

      // Submit generation request
      const genRes = await axios.get(apiUrl);
      if (genRes.data?.status !== "success") {
        await message.unsend(processingMsg.messageID);
        return message.reply("❌ Failed to start generation. Please try again.");
      }

      const taskId = genRes.data.taskId;
      
      // Store task ID
      const tasks = JSON.parse(fs.readFileSync(TASK_JSON, "utf8"));
      tasks[event.threadID] = taskId;
      fs.writeFileSync(TASK_JSON, JSON.stringify(tasks, null, 2));

      // Check image status
      const imageUrl = await this.checkImageStatus(taskId, message, processingMsg);
      if (!imageUrl) return;

      // Send result
      await message.unsend(processingMsg.messageID);
      const stream = await global.utils.getStreamFromURL(imageUrl);
      
      let resultMessage = `🖼️ Generated Image (Ratio: ${ratio})`;
      if (cref) resultMessage += "\n🔗 Using reference image from your reply";
      resultMessage += "\n💬 Reply with:\nU1-U4 for Upscale\nV1-V4 for Variations";
      
      if (!isAdmin) {
        const usageData = JSON.parse(fs.readFileSync(USAGE_LOG, "utf8")) || {};
        const userUsage = usageData[senderID] || { count: 0, lastUsed: 0 };
        const remaining = 5 - userUsage.count;
        resultMessage += `\n\n📊 Usage: ${userUsage.count}/5 (${remaining} remaining today)`;
      }
      
      const sentMsg = await message.reply({
        body: resultMessage,
        attachment: stream
      });

      // Set reply handler
      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: this.config.name,
        taskId: taskId,
        threadID: event.threadID,
        messageID: sentMsg.messageID,
        cref: cref,
        isAdmin: isAdmin // Pass admin status to reply handler
      });

    } catch (err) {
      console.error("Generation error:", err);
      return message.reply("❌ Failed to generate image. Please try again.");
    }
  },

  onReply: async function ({ event, Reply, message }) {
    try {
      const action = event.body.toLowerCase();
      if (!["u1","u2","u3","u4","v1","v2","v3","v4"].includes(action)) return;

      // Check cooldown for non-admin users
      if (!Reply.isAdmin) {
        const now = Date.now();
        const usageData = JSON.parse(fs.readFileSync(USAGE_LOG, "utf8")) || {};
        const senderID = event.senderID;
        const userUsage = usageData[senderID] || { count: 0, lastUsed: 0 };
        
        // Check cooldown (5 minutes)
        const cooldown = 5 * 60 * 1000;
        if (now - userUsage.lastUsed < cooldown) {
          const remainingTime = Math.ceil((cooldown - (now - userUsage.lastUsed)) / 1000 / 60);
          return message.reply(`⏳ Please wait ${remainingTime} more minute(s) before using this command again.`);
        }
        
        // Update last used time
        userUsage.lastUsed = now;
        usageData[senderID] = userUsage;
        fs.writeFileSync(USAGE_LOG, JSON.stringify(usageData, null, 2));
      }

      const actionMsg = await message.reply(`🔄 Processing ${action.toUpperCase()}...`);
      
      // Include original cref if available
      const crefParam = Reply.cref ? `&cref=${encodeURIComponent(Reply.cref)}` : '';
      
      // Submit action request
      const actionRes = await axios.get(
        `https://egret-driving-cattle.ngrok-free.app/api/action?taskid=${Reply.taskId}&action=${action}${crefParam}`
      );
      
      if (actionRes.data?.status !== "success") {
        await message.unsend(actionMsg.messageID);
        return message.reply("❌ Failed to process action. Please try again.");
      }

      const newTaskId = actionRes.data.taskId;
      
      // Update stored task ID
      const tasks = JSON.parse(fs.readFileSync(TASK_JSON, "utf8"));
      tasks[event.threadID] = newTaskId;
      fs.writeFileSync(TASK_JSON, JSON.stringify(tasks, null, 2));

      // Check new image status
      const imageUrl = await this.checkImageStatus(newTaskId, message, actionMsg);
      if (!imageUrl) return;

      // Send result
      await message.unsend(actionMsg.messageID);
      const stream = await global.utils.getStreamFromURL(imageUrl);
      
      let resultMessage = `🎯 ${action.toUpperCase()} Result`;
      if (Reply.cref) resultMessage += "\n🔗 Using original reference image";
      resultMessage += "\n💬 Reply with U1-U4 or V1-V4 to modify again";
      
      if (!Reply.isAdmin) {
        const usageData = JSON.parse(fs.readFileSync(USAGE_LOG, "utf8")) || {};
        const senderID = event.senderID;
        const userUsage = usageData[senderID] || { count: 0, lastUsed: 0 };
        const remaining = 5 - userUsage.count;
        resultMessage += `\n\n📊 Usage: ${userUsage.count}/5 (${remaining} remaining today)`;
      }
      
      const sentMsg = await message.reply({
        body: resultMessage,
        attachment: stream
      });

      // Update reply handler
      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: this.config.name,
        taskId: newTaskId,
        threadID: event.threadID,
        messageID: sentMsg.messageID,
        cref: Reply.cref,
        isAdmin: Reply.isAdmin // Preserve admin status
      });

    } catch (err) {
      console.error("Action error:", err);
      return message.reply("❌ Failed to process action. Please try again.");
    }
  },

  checkImageStatus: async function(taskId, message, statusMsg) {
    try {
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        const statusRes = await axios.get(
          `https://egret-driving-cattle.ngrok-free.app/api/mj-task?taskid=${taskId}`
        );
        
        if (statusRes.data?.task?.outputFileUrl) {
          return statusRes.data.task.outputFileUrl;
        }
        
        if (attempts % 5 === 0 && statusMsg) {
          await message.unsend(statusMsg.messageID);
          statusMsg = await message.reply(`🔄 Still processing (attempt ${attempts}/${maxAttempts})...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      if (statusMsg) await message.unsend(statusMsg.messageID);
      message.reply("⏳ Image is taking longer than expected. Please try again later.");
      return null;
      
    } catch (err) {
      console.error("Status check error:", err);
      if (statusMsg) await message.unsend(statusMsg.messageID);
      message.reply("❌ Error checking image status. Please try again.");
      return null;
    }
  }
}