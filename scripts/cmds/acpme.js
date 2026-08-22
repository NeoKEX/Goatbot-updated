const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "acpme",
    aliases: ['acceptme'],
    version: "1.2",
    author: "Toshiro Editz",
    countDown: 3,
    role: 0,
    shortDescription: "Auto accept user's friend request",
    longDescription: "Checks if user is already added, sent request, or no request",
    category: "Utility"
  },

  onStart: async function ({ event, api }) {

    const userID = event.senderID;

    // STEP 1: Check if user is already a friend
    try {
      const info = await api.getUserInfo(userID);
      const user = info[userID];

      if (user.isFriend === true) {
        return api.sendMessage(
          "✅ You are already added as a friend!",
          event.threadID
        );
      }
    } catch (e) {
      console.log("Friend check error:", e);
    }

    // STEP 2: Get pending friend request list
    const formList = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };

    const res = JSON.parse(
      await api.httpPost("https://www.facebook.com/api/graphql/", formList)
    );

    const listReq = res.data.viewer.friending_possibilities.edges;

    // STEP 3: Check if user has sent request
    const findUser = listReq.find(u => u.node.id === userID);

    if (!findUser) {
      return api.sendMessage(
        "❌ You have not sent a friend request to the bot!\nPlease send a request first.",
        event.threadID
      );
    }

    // STEP 4: Accept the user's friend request
    const formAccept = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
      fb_api_caller_class: "RelayModern",
      doc_id: "3147613905362928",
      variables: JSON.stringify({
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          friend_requester_id: userID,
          client_mutation_id: Math.floor(Math.random() * 9999999).toString()
        },
        scale: 3,
        refresh_num: 0
      })
    };

    const result = JSON.parse(
      await api.httpPost("https://www.facebook.com/api/graphql/", formAccept)
    );

    if (result.errors) {
      return api.sendMessage(
        "❌ Failed to accept your friend request!",
        event.threadID
      );
    }

    // SUCCESS
    return api.sendMessage(
      `✅ Your friend request has been accepted!\nWelcome ${findUser.node.name} 💙`,
      event.threadID
    );
  }
};
