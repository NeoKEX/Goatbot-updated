const axios = require('axios');
module.exports = {
    config: {
        name: "nbpro",
        version: "1.0",
        aliases: ["edit", "nb", "nanobanana", "nanobanana-pro"],
        author: "Tawsif~",
        category: "ai",
        countDown: 5,
        role: 0,
        description: {
            en: "edit & generate images using Nano-banana Pro"
        },
        guide: {
            en: " <prompt> | reply to image"
        }
    },
    onStart: async function({
        message, event, args
    }) {
        let prompt = args.join(" ");
        if ((!event.messageReply && !event?.messageReply?.attachments[0]?.url && !prompt) || (event?.messageReply?.attachments[0]?.url && !prompt)) {
            return message.reply('provide a prompt or reply to an image');
        } else if (!event?.messageReply?.attachments[0] && prompt) {
            let ratio = prompt?.split("--ar=")[1] || prompt?.split("--ar ")[1] || '1:1';
            message.reaction("⏳", event.messageID);
            try {
                const gres = await axios.get(`https://tawsif.is-a.dev/gemini/nano-banana-pro-gen?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`);
                message.reply({
                    body: "✅ | Generated", attachment: await global.utils.getStreamFromURL(gres.data.imageUrl, 'gen.png')
                });
            } catch (e) {
                message.reaction("❌", event.messageID);
            }
        } else {
            let imgs = [];
            for (let i = 0; i < event.messageReply.attachments.length; i++) {
                imgs.push(event.messageReply.attachments[i].url);
            }
            try {
                const eres = await axios.get(`https://tawsif.is-a.dev/gemini/nano-banana-pro-edit?prompt=${encodeURIComponent(prompt)}&urls=${encodeURIComponent(JSON.stringify(imgs))}`);
                await message.reply({
                    attachment: await global.utils.getStreamFromURL(eres.data.imageUrl, 'edit.png'), body: "✅ | image Edited"
                });
            } catch (error) {
                message.reaction("❌", event.messageID);
            }
        }
    }
};