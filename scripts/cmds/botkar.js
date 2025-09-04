module.exports = {
  config: {
    name: "botkar",
    version: "3.2",
    author: "Jaychris Garcia + Modified by NAFIJ",
    countDown: 5,
    role: 0,
    shortDescription: "Detects who made the bot",
    longDescription: "Replies when someone asks or says who created the bot using smart keyword detection.",
    category: "reply"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const text = event.body?.toLowerCase();
    if (!text) return;

    const triggerKeywords = [
      "bot", "kar", "ke", "banai", "banailo", "banaiyeche", "owner", "creator",
      "banay", "banalo", "mod", "modded",
      "modder", "coder", "develop", "developer", "coding", "bananor", "banano",
    ];

    let matchCount = 0;
    for (const word of triggerKeywords) {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi'); // word-boundary based match
      if (pattern.test(text)) matchCount++;
    }

    if (matchCount >= 2) {
      return message.reply("🥺 IM CREATED BY NTKHANG_😐 AND MODED BY NAFIJ_🔥");
    }
  }
};