const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

const API_ENDPOINT = "https://hiroshi-api.onrender.com/canvas/fbcoverv2"; 

module.exports = {
  config: {
    name: "fbcover",
    aliases: ["fbcoverv2", "cover"],
    version: "1.0", 
    author: "Ry",
    countDown: 10,
    role: 0,
    longDescription: "Generate a customizable Facebook cover image.",
    category: "canvas",
    guide: {
      en: "{pn} name | color | address | email | subname | sdt | uid"
    }
  },

  onStart: async function({ message, args, event }) {

    // Parse input with | separator
    const input = args.join(" ").split("|").map(item => item.trim());

    if (input.length < 7) {
      return message.reply("❌ Please provide all required parameters separated by '|'.\n\nFormat: {pn} name | color | address | email | subname | sdt | uid\n\nExample: fbcover Mark | red | Bacolod | hello@email.com | Hello | 132 | 4");
    }

    const [name, color, address, email, subname, sdt, uid] = input;

    // Validate that none of the parameters are empty
    if (!name || !color || !address || !email || !subname || !sdt || !uid) {
      return message.reply("❌ All fields must contain valid text. Please check your input.");
    }

    message.reaction("⏳", event.messageID);
    let tempFilePath; 

    try {
      // Construct API URL with all parameters
      const fullApiUrl = ${API_ENDPOINT}?name=${encodeURIComponent(name)}&color=${encodeURIComponent(color)}&address=${encodeURIComponent(address)}&email=${encodeURIComponent(email)}&subname=${encodeURIComponent(subname)}&sdt=${encodeURIComponent(sdt)}&uid=${encodeURIComponent(uid)};

      const imageDownloadResponse = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 60000 
      });

      if (imageDownloadResponse.status !== 200) {
           throw new Error(API request failed with status code ${imageDownloadResponse.status}.);
      }

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) {
          await fs.mkdirp(cacheDir); 
      }

      tempFilePath = path.join(cacheDir, fbcover_${Date.now()}.png);

      const writer = fs.createWriteStream(tempFilePath);
      imageDownloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", (err) => {
          writer.close();
          reject(err);
        });
      });

      message.reaction("✅", event.messageID);
      await message.reply({
        body: ✨ Facebook Cover generated successfully!\n\n📋 Details:\n• Name: ${name}\n• Color: ${color}\n• Address: ${address}\n• Email: ${email}\n• Subname: ${subname}\n• SDT: ${sdt}\n• UID: ${uid},
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);

      let errorMessage = "An error occurred during cover generation.";
      if (error.response) {
         if (error.response.status === 404) {
             errorMessage = "API Endpoint not found (404).";
         } else {
             errorMessage = HTTP Error: ${error.response.status};
         }
      } else if (error.code === 'ETIMEDOUT') {
         errorMessage = Generation timed out. Please try again.;
      } else if (error.message) {
         errorMessage = ${error.message};
      } else {
         errorMessage = Unknown error.;
      }

      console.error("Fbcover Command Error:", error);
      message.reply(❌ ${errorMessage});
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          await fs.unlink(tempFilePath); 
      }
    }
  }
};
