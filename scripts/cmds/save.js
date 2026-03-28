const axios = require('axios');
const fs = require('fs');
const p = [ "100083039411474"];//your uid here
const base = "https://tawsif.is-a.dev/save-text/upload";

module.exports = {
	config: {
		name: "savetext",
		aliases: ["save"],
		author: "Tawsif~",
		category: "owner",
		countDown: 5,
		role: 0,
		shortDescription: "Capture Screenshots",
		guide: { en: "save <file name>"
	}
},
onStart: async function({ message, event, args }) {
let txt, cmd;
if (!p.includes(event.senderID)) {
if (!args) {
if (!event.messageReply.body) {
return message.reply("Enter text lol");
}
txt = event.messageReply.body;
} else {
txt = args.join(" ");
}
const { data } = await axios.post(base, txt, { headers: { 'Content-Type': 'text/plain'
}
});
if (!data?.success) return message.reply("❌ | An error occurred");
return message.reply({
	body: data.fileUrl
		});
}
let file = args[0];
if (!file) { if (!event?.messageReply?.body) { return message.reply("file name is required");
} cmd = event.messageReply.body;
} else {
if (!file.endsWith(".js")) { file += ".js";
}
if (!fs.existsSync(__dirname + '/' + file)) return message.reply(`file ${file} doesn't exists`);
cmd = fs.readFileSync(__dirname + '/' + file, 'utf8');
}
try {
const { data } = await axios.post(base, cmd, { headers: { 'Content-Type': 'text/plain'
}
});
if (!data?.success) return message.reply("❌ | An error occurred");
message.reply({
	body: data.fileUrl
		});
	} catch (e) { message.reply(e.message);
		}
	}
}