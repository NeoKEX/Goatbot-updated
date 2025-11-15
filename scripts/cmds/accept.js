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

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    }
    else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
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
      const payload = {
        ...form,
        variables: JSON.stringify({
          ...form.variables,
          input: {
            ...form.variables.input,
            friend_requester_id: u.node.id
          }
        })
      };
      newTargetIDs.push(u);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", payload));
    }

    const lengthTarget = newTargetIDs.length;
    for (let i = 0; i < lengthTarget; i++) {
      try {
        const friendRequest = await promiseFriends[i];
        const response = JSON.parse(friendRequest);
        if (response.errors) {
          console.log(`GraphQL Error for ${newTargetIDs[i].node.name}:`, response.errors);
          failed.push(newTargetIDs[i].node.name);
        }
        else {
          success.push(newTargetIDs[i].node.name);
        }
      }
      catch (e) {
        console.log(`Error for ${newTargetIDs[i].node.name}:`, e.message);
        failed.push(newTargetIDs[i].node.name);
      }
    }

    if (success.length > 0) {
      api.sendMessage(`Â» The ${args[0] === 'add' ? 'friend request' : 'friend request deletion'} has been processed for ${success.length} people:\n\n${success.join("\n")}${failed.length > 0 ? `\nÂ» The following ${failed.length} people encountered errors: ${failed.join("\n")}` : ""}`, event.threadID, event.messageID);
    } else {
      api.unsendMessage(messageID); // Unsend the message if the response is incorrect
      return api.sendMessage("Invalid response. Please provide a valid response.", event.threadID);
    }

    api.unsendMessage(messageID); // Unsend the message after it has been processed
  },

  onStart: async function ({ event, api, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };
      
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const data = JSON.parse(response);
      
      console.log("Accept command - full response:", JSON.stringify(data, null, 2));
      
      if (!data.data || !data.data.viewer || !data.data.viewer.friending_possibilities) {
        return api.sendMessage("❌ Could not fetch friend requests. Please try again later.", event.threadID, event.messageID);
      }
      
      const listRequest = data.data.viewer.friending_possibilities.edges;
      
      if (!listRequest || listRequest.length === 0) {
        return api.sendMessage("✅ You have no pending friend requests.", event.threadID, event.messageID);
      }
      
      let msg = "";
      let i = 0;
      for (const user of listRequest) {
        i++;
        const timestamp = user.time || user.node.friending_time || user.node.time || Date.now() / 1000;
        msg += (`\n${i}. Name: ${user.node.name}`
          + `\nID: ${user.node.id}`
          + `\nUrl: ${user.node.url.replace("www.facebook", "fb")}`
          + `\nTime: ${moment(timestamp * 1000).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n`);
      }
      
      api.sendMessage(`${msg}\nReply to this message with content: <add | del> <number | or "all"> to take action`, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, this.config.countDown * 1000)
        });
      }, event.messageID);
    } catch (error) {
      console.log("Accept command error:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};