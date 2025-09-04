const axios = require('axios');

module.exports = {
  config: {
    name: "bachal",
    aliases: [],
    version: "1.0",
    author: "kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "Get the top 15 users by message count in the current chat",
    longDescription: "Get the top 15 users by message count in the current chat",
    category: "𝗙𝗨𝗡",
    guide: "{p}{n}",
  },

  onStart: async function ({ api, event }) {
    const threadId = event.threadID;

    try {
      const threadInfo = await api.getThreadInfo(threadId);
      const messageCounts = {};

      threadInfo.participantIDs.forEach(id => {
        messageCounts[id] = 0;
      });

      const messages = await api.getThreadHistory(threadId, 1000); // adjust limit here if needed

      messages.forEach(msg => {
        if (messageCounts[msg.senderID] !== undefined) {
          messageCounts[msg.senderID]++;
        }
      });

      const topUsers = Object.entries(messageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      let rankList = [];

      for (let i = 0; i < topUsers.length; i++) {
        const [uid, count] = topUsers[i];
        const userInfo = await api.getUserInfo(uid);
        const userName = userInfo[uid]?.name || "Unknown User";
        rankList.push(`${i + 1}. ${userName} [${count} messages]`);
      }

      const resultText =
        "𝗕𝗲𝗿𝗼𝗷𝗴𝗮𝗿 ,বাচাল পোলাপাইন দেন দেখে নিন:\nএরা সারা দিন গ্রুপে পকর পকর করে 💁‍♀️:\n\n" +
        rankList.join("\n");

      api.sendMessage(resultText, threadId);
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Something went wrong while fetching message data.", threadId);
    }
  },
};