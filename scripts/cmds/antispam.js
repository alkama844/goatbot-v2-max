let messageLogs = {};
let spamDetectionEnabled = true;
const spamThreshold = 25;
const timeWindow = 5000; // 5 seconds

module.exports = {
  config: {
    name: "antispam",
    aliases: ["aspam"],
    version: "1.2",
    author: "NAFIJ PRO",
    category: "admin",
    shortDescription: "Auto kick spammers",
    longDescription: "Automatically kicks users who send 25+ messages within 5 seconds",
    guide: "{pn} on | off"
  },

  onStart: function ({ api, event, args }) {
    const { threadID, senderID, isGroup, isAdmin } = event;
    const command = args[0]?.toLowerCase();

    // Only allow admins to toggle
    if (["on", "off"].includes(command)) {
      if (!isAdmin) return api.sendMessage("❌ Only admins can toggle spam detection.", threadID);

      if (command === "on") {
        spamDetectionEnabled = true;
        return api.sendMessage("🟢 Spam detection has been enabled.", threadID);
      } else {
        spamDetectionEnabled = false;
        return api.sendMessage("🔴 Spam detection has been disabled.", threadID);
      }
    }

    if (!isGroup || !spamDetectionEnabled) return;

    const now = Date.now();
    if (!messageLogs[threadID]) messageLogs[threadID] = {};
    if (!messageLogs[threadID][senderID]) messageLogs[threadID][senderID] = [];

    messageLogs[threadID][senderID].push(now);

    // Remove timestamps older than timeWindow
    messageLogs[threadID][senderID] = messageLogs[threadID][senderID].filter(ts => now - ts <= timeWindow);

    if (messageLogs[threadID][senderID].length >= spamThreshold) {
      api.removeUserFromGroup(senderID, threadID, err => {
        if (!err) {
          api.sendMessage(
            {
              body: `🚫 Kicked for spamming (${spamThreshold} messages in ${timeWindow / 1000} seconds).`,
              mentions: [{ tag: senderID, id: senderID }]
            },
            threadID
          );
        }
      });
      delete messageLogs[threadID][senderID];
    }
  }
};