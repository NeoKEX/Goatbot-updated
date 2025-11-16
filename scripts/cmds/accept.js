const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "1.0",
    author: "Loid Butter",
    countDown: 8,
    role: 2,
    shortDescription: "accept users",
    longDescription: "accept users",
    category: "Utility",
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.replace(/ +/g, " ").toLowerCase().split(" ");

    clearTimeout(Reply.unsendTimeout); // Clear the timeout if the user responds within the countdown duration

    const success = [];
    const failed = [];

    let doc_id;
    let friendly_name;

    if (args[0] === "add") {
      friendly_name = "FriendingCometFriendRequestConfirmMutation";
      doc_id = "8052155221530577";
    }
    else if (args[0] === "del") {
      friendly_name = "FriendingCometFriendRequestDeleteMutation";
      doc_id = "7988363234586686";
    }
    else {
      return api.sendMessage("Please select <add | del > <target number | or \"all\">", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);

    if (args[1] === "all") {
      targetIDs = [];
      const lengthList = listRequest.length;
      for (let i = 1; i <= lengthList; i++) targetIDs.push(i);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const u = listRequest[parseInt(stt) - 1];
      if (!u) {
        failed.push(`Can't find stt ${stt} in the list`);
        continue;
      }

      const requestForm = {
        av: api.getCurrentUserID(),
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: friendly_name,
        doc_id: doc_id,
        variables: JSON.stringify({
          input: {
            attribution_id_v2: "CometFriendRequestsRootQuery.react,comet.people.friendrequests,tap_search_bar,1731780000000,1234567,190055527696468,,",
            friend_requester_id: u.node.id,
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            client_mutation_id: Math.round(Math.random() * 1000000).toString()
          },
          scale: 3,
          refresh_num: 0
        })
      };

      newTargetIDs.push(u);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", requestForm));
    }

    const lengthTarget = newTargetIDs.length;
    for (let i = 0; i < lengthTarget; i++) {
      try {
        const response = await promiseFriends[i];
        
        const safeJsonParse = (str) => {
          if (typeof str === 'object') return str;
          try {
            return JSON.parse(str);
          } catch {
            return null;
          }
        };

        const friendRequest = safeJsonParse(response);
        
        if (friendRequest && friendRequest.errors && friendRequest.errors.length > 0) {
          failed.push(newTargetIDs[i].node.name);
        }
        else if (friendRequest && friendRequest.data) {
          success.push(newTargetIDs[i].node.name);
        }
        else {
          failed.push(newTargetIDs[i].node.name);
        }
      }
      catch (e) {
        console.log("Accept command error:", e.message);
        failed.push(newTargetIDs[i].node.name);
      }
    }

    api.unsendMessage(messageID);
    
    if (success.length > 0) {
      return api.sendMessage(`» The ${args[0] === 'add' ? 'friend request' : 'friend request deletion'} has been processed for ${success.length} people:\n\n${success.join("\n")}${failed.length > 0 ? `\n\n» The following ${failed.length} people encountered errors:\n${failed.join("\n")}` : ""}`, event.threadID, event.messageID);
    } else {
      return api.sendMessage(`❌ All requests failed:\n\n${failed.join("\n")}\n\nPlease check the errors and try again.`, event.threadID, event.messageID);
    }
  },

  onStart: async function ({ event, api, commandName, message }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "8559148610815077",
        variables: JSON.stringify({ input: { scale: 3 } })
      };
      
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      
      const safeJsonParse = (str) => {
        if (typeof str === 'object') return str;
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      };
      
      const data = safeJsonParse(response);
      
      if (!data || !data.data || !data.data.viewer || !data.data.viewer.friending_possibilities) {
        return message.reply("❌ Unable to fetch friend requests. Please try again later.");
      }
      
      const listRequest = data.data.viewer.friending_possibilities.edges;
      
      if (!listRequest || listRequest.length === 0) {
        return message.reply("✅ You have no pending friend requests!");
      }
      
      let msg = "";
      let i = 0;
      for (const user of listRequest) {
        i++;
        const timestamp = user.time;
        const formattedTime = (timestamp && !isNaN(timestamp)) 
          ? moment(timestamp * 1000).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss") 
          : "Unknown";
        msg += (`\n${i}. Name: ${user.node.name}`
          + `\nID: ${user.node.id}`
          + `\nUrl: ${user.node.url.replace("www.facebook", "fb")}`
          + `\nTime: ${formattedTime}\n`);
      }
      
      api.sendMessage(`${msg}\nReply to this message with content: <add | del> <comparison | or "all"> to take action`, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID); // Unsend the message after the countdown duration
          }, this.config.countDown * 1000) // Convert countdown duration to milliseconds
        });
      }, event.messageID);
    } catch (error) {
      console.log("Accept command onStart error:", error.message);
      return message.reply("❌ An error occurred while fetching friend requests. Please try again later.");
    }
  }
};