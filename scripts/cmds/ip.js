const axios = require("axios");

module.exports = {
  config: {
    name: "ip",
    version: "2.0.0",
    aliases: ["ipinfo", "iplookup"],
    author: "Arjhil, VincentSensei",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Check IP information"
    },
    longDescription: {
      en: "Check IP address geolocation and other information"
    },
    category: "other",
    guide: {
      en: "{pn} [ip_address]"
    }
  },

  onStart: async function ({ api, args, event, message }) {
    const adminName = "Vincent Sensei";
    const adminLink = "https://web.facebook.com/vincent.09123455";

    if (!args[0]) {
      return message.reply("Please enter an IP address to check.\nUsage: ip [ip_address]");
    }

    const ipAddress = args[0];

    try {
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
      const infoip = response.data;

      if (infoip.status === "fail") {
        return message.reply(`Error! An error occurred. Please try again later: ${infoip.message}`);
      }

      const userInfo = await api.getUserInfo(event.senderID);
      const userObj = userInfo[event.senderID];

      const userName = userObj ? userObj.name || "Name not available" : "Name not available";
      const userUID = event.senderID;
      const userGender = userObj ? (userObj.gender === 1 ? "Male" : userObj.gender === 2 ? "Female" : "Gender not available") : "Gender not available";
      const userBirthday = userObj ? userObj.birthday || "Birthday not available" : "Birthday not available";

      const userStatus = userObj ? (userObj.isOnline ? "Online 🟢" : "Offline 🔴") : "Status not available";

      const areFriends = userObj ? (userObj.isFriend ? "Yes ✅" : "No ❌") : "Friendship status not available";

      const fbLink = `https://www.facebook.com/profile.php?id=${userUID}`;

      const geolocationInfo = `
🌍 Location: ${infoip.city}, ${infoip.regionName}, ${infoip.country}
🏁 Country Code: ${infoip.countryCode}
🌆 Region/State: ${infoip.regionName}
🏙️ City: ${infoip.city}
📮 ZIP code: ${infoip.zip}
🌐 Latitude: ${infoip.lat}
🌐 Longitude: ${infoip.lon}
⏰ Timezone: ${infoip.timezone}
🏢 ISP: ${infoip.isp}
🏢 Organization: ${infoip.org}
🖥️ AS: ${infoip.as}
🔍 IP Query: ${infoip.query}

User Information:
👤 User Name: ${userName}
🆔 User UID: ${userUID}
🧍 Gender: ${userGender}
🎂 Birthday: ${userBirthday}
⏳ Status: ${userStatus}
🤝 Friends: ${areFriends}
🌐 Facebook Profile: ${fbLink}

Admin Information:
👤 Admin Name: ${adminName}
🆔 Admin UID: ${adminUID}
🔗 Admin Profile: ${adminLink}

Location Map:
🗺️ [View on Map](https://www.google.com/maps?q=${infoip.lat},${infoip.lon})
`;

      return message.reply(geolocationInfo);
    } catch (error) {
      console.error(error);
      return message.reply("An error occurred while processing the request.");
    }
  }
};
