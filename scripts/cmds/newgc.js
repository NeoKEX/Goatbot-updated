 
module.exports = {
config: {
		name: "newbox",
 aliases: ["newgc", "createbox"],
 version: "1.0",
		author: "Chitron Bhattacharjee",
		countDown: 5,
		role: 2,
		shortDescription: "Create a new chat group with the tag",
		longDescription: "Create a new chat group with the tag",
		category: "owner",
		guide: {
 en: '"{pn} [tag]: [New group name] or "{pn} me [tag]: [New group name]"',
 }
	},

 onStart: async function ({ api, event, args, Users }) {
 function checkPermissionAndSendMessage(permission, message) {
 if (!permission.includes(event.senderID)) {
 api.sendMessage(message, event.threadID, event.messageID);
 return false;
 }
 return true;
}

const GODPermission = global.GoatBot.config.GOD;
const vipUserPermission = global.GoatBot.config.vipUser;
const adminBotPermission = global.GoatBot.config.adminBot;

const permissionMessage = "You are not VIP user to use this cmd. Use /request to ask permission for this cmd to authors";

if (!checkPermissionAndSendMessage(GODPermission, permissionMessage)) {
 return;
}

if (!checkPermissionAndSendMessage(vipUserPermission, permissionMessage)) {
 return;
}
if (!checkPermissionAndSendMessage(adminBotPermission, permissionMessage)) {
 return;
}
 if (args[0] == "me")
 var id = [event.senderID]
 else id = [];
 var main = event.body; 
 var groupTitle = main.slice(main.indexOf("|") +2)
 for (var i = 0; i < Object.keys(event.mentions).length; i++)
id.push(Object.keys(event.mentions)[i]);
 api.createNewGroup(id, groupTitle,() => {api.sendMessage(`✔| created group: ${groupTitle}`, event.threadID)})
 }
};