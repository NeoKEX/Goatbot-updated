const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "2.0",
    author: "Neoaz 🐊",
    countDown: 10,
    role: 0,
    shortDescription: "Manage friend requests",
    longDescription: "Accept or delete friend requests with role-based access.",
    category: "Utility",
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;

    const args = event.body.trim().split(" ");
    const action = args[0].toLowerCase();
    
    if (!["add", "del"].includes(action)) {
      return message.reply("Please use: add <num/all> or del <num/all>");
    }

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

    if (action === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    } else {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }

    let targetIndices = args.slice(1);
    if (args[1] === "all") {
      targetIndices = listRequest.map((_, i) => i + 1);
    }

    const success = [];
    const failed = [];

    for (const index of targetIndices) {
      const u = listRequest[parseInt(index) - 1];
      if (!u) {
        failed.push(`Index ${index} not found`);
        continue;
      }

      form.variables.input.friend_requester_id = u.node.id;
      try {
        const res = await api.httpPost("https://www.facebook.com/api/graphql/", {
          ...form,
          variables: JSON.stringify(form.variables)
        });
        if (JSON.parse(res).errors) failed.push(u.node.name);
        else success.push(u.node.name);
      } catch (e) {
        failed.push(u.node.name);
      }
    }

    api.unsendMessage(messageID);
    let resultMsg = `Processed ${success.length} requests:`;
    if (success.length > 0) resultMsg += `\n✅ Success: ${success.join(", ")}`;
    if (failed.length > 0) resultMsg += `\n❌ Failed: ${failed.join(", ")}`;
    
    message.reply(resultMsg);
  },

  onStart: async function ({ event, api, commandName, Role }) {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };

    try {
      const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(res).data.viewer.friending_possibilities.edges;

      if (listRequest.length === 0) return message.reply("No pending friend requests.");

      const isAdmin = global.GoatBot.config.adminIDs.includes(event.senderID) || global.GoatBot.config.developerIDs.includes(event.senderID);

      if (!isAdmin) {
        const userRequest = listRequest.find(u => u.node.id === event.senderID);
        if (userRequest) {
          const autoForm = {
            av: api.getCurrentUserID(),
            fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
            fb_api_caller_class: "RelayModern",
            doc_id: "3147613905362928",
            variables: JSON.stringify({
              input: {
                source: "friends_tab",
                actor_id: api.getCurrentUserID(),
                friend_requester_id: event.senderID,
                client_mutation_id: "1"
              },
              scale: 3,
              refresh_num: 0
            })
          };
          await api.httpPost("https://www.facebook.com/api/graphql/", autoForm);
          return api.sendMessage(`✅ Your request has been automatically accepted!`, event.threadID, event.messageID);
        } else {
          return api.sendMessage(`❌ You don't have any pending request on this bot. Only Admins can see the full list.`, event.threadID, event.messageID);
        }
      }

      let msg = "───『 FRIEND REQUESTS 』───\n";
      listRequest.forEach((user, i) => {
        msg += `\n${i + 1}. 👤 Name: ${user.node.name}`;
        msg += `\n🆔 ID: ${user.node.id}`;
        msg += `\n📅 Time: ${moment(user.time * 1000).tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm A")}\n`;
      });

      msg += `\n───────────────────\nReply with: <add/del> <index/all>`;

      api.sendMessage(msg, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID
        });
      }, event.messageID);

    } catch (e) {
      api.sendMessage("Error fetching requests.", event.threadID);
    }
  }
};
