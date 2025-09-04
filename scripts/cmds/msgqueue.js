module.exports = {
	config: {
		name: "msgqueue",
		aliases: ["queue", "messagequeue"],
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 2,
		description: {
			vi: "Quản lý hàng đợi tin nhắn và kiểm soát tốc độ gửi",
			en: "Manage message queue and sending speed control"
		},
		category: "system",
		guide: {
			vi: "   {pn} status: xem trạng thái hàng đợi\n   {pn} speed <1-10>: đặt tốc độ gửi tin nhắn\n   {pn} clear: xóa hàng đợi\n   {pn} pause: tạm dừng\n   {pn} resume: tiếp tục",
			en: "   {pn} status: view queue status\n   {pn} speed <1-10>: set message sending speed\n   {pn} clear: clear queue\n   {pn} pause: pause queue\n   {pn} resume: resume queue"
		}
	},

	langs: {
		vi: {
			status: "📊 Trạng thái Hàng đợi:\n\n🔄 Status: %1\n📨 Messages in queue: %2\n⚡ Speed level: %3\n⏱️ Average delay: %4ms\n🤖 Mode: %5",
			speedSet: "⚡ Đã đặt tốc độ gửi tin nhắn: %1/10",
			cleared: "🗑️ Đã xóa hàng đợi tin nhắn",
			paused: "⏸️ Đã tạm dừng hàng đợi",
			resumed: "▶️ Đã tiếp tục hàng đợi",
			invalidSpeed: "❌ Tốc độ phải từ 1-10",
			onlyBotAdmin: "❌ Chỉ admin bot mới có thể sử dụng lệnh này",
			error: "❌ Lỗi: %1"
		},
		en: {
			status: "📊 Queue Status:\n\n🔄 Status: %1\n📨 Messages in queue: %2\n⚡ Speed level: %3\n⏱️ Average delay: %4ms\n🤖 Mode: %5",
			speedSet: "⚡ Message sending speed set to: %1/10",
			cleared: "🗑️ Message queue cleared",
			paused: "⏸️ Queue paused",
			resumed: "▶️ Queue resumed",
			invalidSpeed: "❌ Speed must be 1-10",
			onlyBotAdmin: "❌ Only bot admins can use this command",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, globalData, getLang }) {
		try {
			if (!global.GoatBot.config.adminBot.includes(event.senderID)) {
				return message.reply(getLang("onlyBotAdmin"));
			}

			const action = args[0]?.toLowerCase();
			
			// Initialize queue data if not exists
			let queueData = await globalData.get("messageQueue", "data", {
				speed: 5,
				paused: false,
				cleared: false,
				queue: []
			});

			switch (action) {
				case "speed":
					const speed = parseInt(args[1]);
					if (isNaN(speed) || speed < 1 || speed > 10) {
						return message.reply(getLang("invalidSpeed"));
					}
					queueData.speed = speed;
					await globalData.set("messageQueue", queueData, "data");
					
					// Update global speed setting
					global.humanBehaviorSpeed = speed;
					
					return message.reply(getLang("speedSet", speed));

				case "clear":
					queueData.queue = [];
					queueData.cleared = true;
					await globalData.set("messageQueue", queueData, "data");
					return message.reply(getLang("cleared"));

				case "pause":
					queueData.paused = true;
					await globalData.set("messageQueue", queueData, "data");
					return message.reply(getLang("paused"));

				case "resume":
					queueData.paused = false;
					await globalData.set("messageQueue", queueData, "data");
					return message.reply(getLang("resumed"));

				default:
					const behaviorStats = global.GoatBot.fcaApi.getHumanBehaviorStats?.() || {};
					const mode = behaviorStats.isHumanMode ? "Human 🧠" : "Robot 🤖";
					const averageDelay = queueData.speed * 200; // Calculate delay based on speed
					
					const response = getLang("status",
						queueData.paused ? "Paused" : "Active",
						queueData.queue.length || 0,
						queueData.speed,
						averageDelay,
						mode
					);
					
					return message.reply(response);
			}

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};