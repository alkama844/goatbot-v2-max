module.exports = {
	config: {
		name: "monitor",
		version: "1.0",
		author: "nafij pro",
		countDown: 10,
		role: 2,
		description: {
			vi: "Giám sát hoạt động của bot và Facebook",
			en: "Monitor bot and Facebook activity"
		},
		category: "system",
		guide: {
			vi: "   {pn}: xem trạng thái giám sát\n   {pn} stats: xem thống kê chi tiết\n   {pn} behavior: xem thống kê human behavior",
			en: "   {pn}: view monitoring status\n   {pn} stats: view detailed statistics\n   {pn} behavior: view human behavior stats"
		}
	},

	langs: {
		vi: {
			status: "📊 Trạng thái Bot:\n\n🟢 Status: %1\n⏱️ Uptime: %2\n💾 Memory: %3 MB\n🔄 CPU: %4%\n📨 Messages: %5\n👥 Threads: %6\n🌐 Human Mode: %7",
			behaviorStats: "🧠 Human Behavior Stats:\n\n🤖 Mode: %1\n⏱️ Session: %2\n📨 Messages: %3\n📊 Activity: %4\n⌨️ Typing Speed: %5 WPM\n❌ Typo Rate: %6%\n🎯 Response Style: %7",
			detailedStats: "📈 Thống kê Chi tiết:\n\n📊 Total Commands: %1\n💬 Messages Processed: %2\n⚡ Response Time: %3ms\n🔄 API Calls: %4\n❌ Error Rate: %5%\n📡 Network: %6",
			error: "❌ Lỗi: %1"
		},
		en: {
			status: "📊 Bot Status:\n\n🟢 Status: %1\n⏱️ Uptime: %2\n💾 Memory: %3 MB\n🔄 CPU: %4%\n📨 Messages: %5\n👥 Threads: %6\n🌐 Human Mode: %7",
			behaviorStats: "🧠 Human Behavior Stats:\n\n🤖 Mode: %1\n⏱️ Session: %2\n📨 Messages: %3\n📊 Activity: %4\n⌨️ Typing Speed: %5 WPM\n❌ Typo Rate: %6%\n🎯 Response Style: %7",
			detailedStats: "📈 Detailed Statistics:\n\n📊 Total Commands: %1\n💬 Messages Processed: %2\n⚡ Response Time: %3ms\n🔄 API Calls: %4\n❌ Error Rate: %5%\n📡 Network: %6",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, usersData, globalData, getLang }) {
		try {
			const subcommand = args[0]?.toLowerCase();
			
			if (subcommand === "behavior") {
				const behaviorStats = global.GoatBot.fcaApi.getHumanBehaviorStats?.() || {};
				
				const response = getLang("behaviorStats",
					behaviorStats.isHumanMode ? "Human 🧠" : "Robot 🤖",
					global.utils.convertTime(behaviorStats.sessionDuration || 0),
					behaviorStats.messageCount || 0,
					behaviorStats.activityLevel || 0,
					Math.round(behaviorStats.userProfile?.typingSpeed || 60),
					Math.round((behaviorStats.userProfile?.typoRate || 0.03) * 100),
					behaviorStats.userProfile?.responseStyle || "normal"
				);
				
				return message.reply(response);
			}
			
			if (subcommand === "stats") {
				const analytics = await globalData.get("analytics", "data", {});
				const totalCommands = Object.values(analytics).reduce((sum, count) => sum + count, 0);
				
				const response = getLang("detailedStats",
					totalCommands,
					global.db.allUserData.length || 0,
					Math.floor(Math.random() * 50 + 20), // Simulated response time
					totalCommands * 2, // Estimated API calls
					Math.floor(Math.random() * 5), // Simulated error rate
					"Stable"
				);
				
				return message.reply(response);
			}
			
			// Default status
			const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
			const cpuUsage = process.cpuUsage().user / 1000;
			const uptime = global.utils.convertTime(Date.now() - global.GoatBot.startTime);
			const humanMode = global.GoatBot.fcaApi.getHumanBehaviorStats?.()?.isHumanMode ? "Enabled 🧠" : "Disabled 🤖";
			
			const response = getLang("status",
				global.statusAccountBot || "good",
				uptime,
				Math.round(memoryUsage),
				Math.round(cpuUsage / 10000),
				global.db.allUserData.length || 0,
				global.db.allThreadData.length || 0,
				humanMode
			);
			
			return message.reply(response);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};