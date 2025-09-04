module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "💰", "cash"],
    version: "3.0",
    author: "NTKhang & redesign by EXOCRAT",
    countDown: 3,
    role: 0,
    shortDescription: "💰 Check financial status",
    longDescription: "View detailed financial information with beautiful formatting",
    category: "economy",
    guide: {
      en: "{pn} - View your balance\n{pn} @user - Check another user's balance\n{pn} top - View wealth rankings"
    }
  },

  langs: {
    en: {
      balanceTitle: "✨ 𝗙𝗜𝗻𝗮𝗻𝗰𝗶𝗮𝗹 𝗦𝘁𝗮𝘁𝘂𝘀  ✨",
      yourBalance: "👤 𝗬𝗼𝘂 𝗵𝗮𝘃𝗲:\n━━━━━━━━━━━━\n💰 𝗖𝗮𝘀𝗵: %1\n🏦 𝗕𝗮𝗻𝗸: %2\n💎 𝗧𝗼𝘁𝗮𝗹: %3\n━━━━━━━━━━━━",
      userBalance: "👤 𝗨𝘀𝗲𝗿: %1\n━━━━━━━━━━━━\n💰 𝗖𝗮𝘀𝗵: %2\n🏦 𝗕𝗮𝗻𝗸: %3\n💎 𝗧𝗼𝘁𝗮𝗹: %4\n━━━━━━━━━━━━",
      leaderboardTitle: "🏆 𝗪𝗲𝗮𝗹𝘁𝗵 𝗟𝗲𝗮𝗱𝗲𝗿𝗯𝗼𝗮𝗿𝗱  🏆",
      leaderboardEntry: "▸ 𝗥𝗮𝗻𝗸 #%1: %2\n   %3 〘 %4 〙\n   💰 %5  🏦 %6\n━━━━━━━━━━━━",
      noBalance: "💸 You're broke! Start earning!",
      processing: "📊 Calculating wealth..."
    }
  },

  formatMoney: function (num) {
    if (isNaN(num)) return "0";
    const units = ["", "K", "M", "B", "T"];
    let unitIndex = 0;
    let n = parseFloat(num);
    
    while (n >= 1000 && unitIndex < units.length - 1) {
      n /= 1000;
      unitIndex++;
    }
    
    return n.toFixed(n < 10 ? 2 : 1) + units[unitIndex];
  },

  getProgressBar: function (percentage) {
    const progress = Math.min(100, Math.max(0, percentage));
    const filled = "■".repeat(Math.round(progress/10));
    const empty = "□".repeat(10 - Math.round(progress/10));
    return `[${filled}${empty}] ${progress.toFixed(1)}%`;
  },

  onStart: async function ({ message, usersData, event, args, getLang }) {
    // Show processing message
    await message.reply(getLang("processing"));
    
    const { senderID, mentions } = event;
    
    // Leaderboard mode
    if (args[0]?.toLowerCase() === "top") {
      const allUsers = await usersData.getAll();
      const wealthyUsers = allUsers
        .filter(user => user.money || user.bank)
        .sort((a, b) => (b.money + b.bank) - (a.money + a.bank))
        .slice(0, 10);
      
      if (wealthyUsers.length === 0) {
        return message.reply(getLang("noBalance"));
      }
      
      const maxWealth = wealthyUsers[0].money + wealthyUsers[0].bank;
      const leaderboard = wealthyUsers.map((user, index) => {
        const name = user.name || `User ${user.ID}`;
        const total = user.money + user.bank;
        const progress = this.getProgressBar((total/maxWealth)*100);
        return getLang(
          "leaderboardEntry",
          index + 1,
          name,
          progress,
          this.formatMoney(total),
          this.formatMoney(user.money),
          this.formatMoney(user.bank)
        );
      }).join("\n");
      
      return message.reply(
        `📜 ${getLang("leaderboardTitle")}\n\n${leaderboard}`
      );
    }
    
    // Check another user's balance
    if (Object.keys(mentions).length > 0) {
      const targetID = Object.keys(mentions)[0];
      const userData = await usersData.get(targetID);
      const cash = this.formatMoney(userData.money || 0);
      const bank = this.formatMoney(userData.bank || 0);
      const total = this.formatMoney((userData.money || 0) + (userData.bank || 0));
      
      return message.reply(
        `${getLang("balanceTitle")}\n` +
        getLang("userBalance", 
          mentions[targetID].replace("@", ""), 
          cash, 
          bank, 
          total
        )
      );
    }
    
    // Check own balance
    const userData = await usersData.get(senderID);
    const cash = this.formatMoney(userData.money || 0);
    const bank = this.formatMoney(userData.bank || 0);
    const total = this.formatMoney((userData.money || 0) + (userData.bank || 0));
    
    message.reply(
      `${getLang("balanceTitle")}\n` +
      getLang("yourBalance", cash, bank, total)
    );
  }
};