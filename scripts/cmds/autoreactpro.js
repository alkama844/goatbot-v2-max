const fs = require('fs');
const path = 'autoreact.json';

let autoReactData = {};

// Ensure the JSON file exists or create it
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify({}, null, 2));
}

try {
  const data = fs.readFileSync(path, 'utf-8');
  autoReactData = JSON.parse(data);
} catch (error) {
  console.error('Error reading JSON file:', error.message);
}

module.exports = {
  config: {
    name: "autoreactpro",
    category: "utility",
    role: 2,
    author: "NAFIJ ( MODDED )"
  },

  // React to message if matched
  onChat: async function ({ message, event }) {
    const msgText = (event.body || "").toLowerCase();
    const threadID = event.threadID;

    const threadData = autoReactData[threadID];
    if (!threadData || threadData.status === false) return;

    for (const emoji in threadData.reactions || {}) {
      if (threadData.reactions[emoji].some(word => msgText.includes(word))) {
        return message.reaction(emoji, event.messageID);
      }
    }
  },

  // Command processing
  onStart: async function ({ message, args, event }) {
    const threadID = event.threadID;
    const subCommand = args[0]?.toLowerCase();

    // Initialize if not present
    if (!autoReactData[threadID]) {
      autoReactData[threadID] = { status: true, reactions: {} };
    }

    // TOGGLE
    if (subCommand === "on" || subCommand === "off") {
      autoReactData[threadID].status = subCommand === "on";
      fs.writeFileSync(path, JSON.stringify(autoReactData, null, 2));
      return message.reply(`✅ | AutoReact has been turned **${subCommand.toUpperCase()}** for this group.`);
    }

    // REMOVE
    if (subCommand === "remove") {
      if (args[2] !== "=>" || !args[1] || !args[3]) {
        return message.reply("❌ | Use format: autoreactpro remove 🙂 => hi");
      }

      const emoji = args[1];
      const keywords = args.slice(3).join(' ').split(',').map(w => w.trim());

      if (!autoReactData[threadID].reactions[emoji]) {
        return message.reply("⚠️ | No keywords found for that emoji.");
      }

      autoReactData[threadID].reactions[emoji] = autoReactData[threadID].reactions[emoji].filter(k => !keywords.includes(k));
      if (autoReactData[threadID].reactions[emoji].length === 0) {
        delete autoReactData[threadID].reactions[emoji];
      }

      fs.writeFileSync(path, JSON.stringify(autoReactData, null, 2));
      return message.reply(`🗑️ | Removed keywords: ${keywords.join(", ")} from emoji: ${emoji}`);
    }

    // ADD
    if (args[1] !== "=>" || !args[0] || !args[2]) {
      return message.reply("❌ | Use format: autoreactpro 🙂 => hi,hello");
    }

    const emoji = args[0];
    const keywords = args.slice(2).join(' ').split(',').map(w => w.trim());

    if (!autoReactData[threadID].reactions[emoji]) {
      autoReactData[threadID].reactions[emoji] = [];
    }

    autoReactData[threadID].reactions[emoji] = [...new Set([...autoReactData[threadID].reactions[emoji], ...keywords])];

    fs.writeFileSync(path, JSON.stringify(autoReactData, null, 2));
    return message.reply(`✅ | Added: ${keywords.join(", ")} => ${emoji}`);
  }
};