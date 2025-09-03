module.exports = {
	config: {
		name: "autoreact",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 1,
		description: {
			vi: "Tự động react tin nhắn với emoji ngẫu nhiên hoặc cụ thể",
			en: "Automatically react to messages with random or specific emoji"
		},
		category: "entertainment",
		guide: {
			vi: "   {pn} on: bật auto react với emoji ngẫu nhiên\n   {pn} off: tắt auto react\n   {pn} set <emoji>: đặt emoji cụ thể cho auto react\n   {pn} list: xem danh sách emoji có sẵn",
			en: "   {pn} on: enable auto react with random emoji\n   {pn} off: disable auto react\n   {pn} set <emoji>: set specific emoji for auto react\n   {pn} list: view available emoji list"
		}
	},

	langs: {
		vi: {
			turnedOn: "✅ Đã bật auto react với emoji ngẫu nhiên",
			turnedOnWithEmoji: "✅ Đã bật auto react với emoji: %1",
			turnedOff: "❌ Đã tắt auto react",
			setEmoji: "✅ Đã đặt emoji auto react: %1",
			currentStatus: "🔄 Trạng thái hiện tại: %1",
			emojiList: "😊 Danh sách emoji có sẵn:\n❤️ 😂 😮 😢 😡 👍 👎 💖",
			invalidEmoji: "❌ Emoji không hợp lệ",
			error: "❌ Lỗi: %1"
		},
		en: {
			turnedOn: "✅ Auto react enabled with random emoji",
			turnedOnWithEmoji: "✅ Auto react enabled with emoji: %1",
			turnedOff: "❌ Auto react disabled",
			setEmoji: "✅ Set auto react emoji: %1",
			currentStatus: "🔄 Current status: %1",
			emojiList: "😊 Available emoji list:\n❤️ 😂 😮 😢 😡 👍 👎 💖",
			invalidEmoji: "❌ Invalid emoji",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, getLang }) {
		try {
			const threadID = event.threadID;
			const action = args[0]?.toLowerCase();
			
			let threadData = await threadsData.get(threadID);
			if (!threadData.data.autoReact) {
				threadData.data.autoReact = { enabled: false, emoji: null };
			}
			
			if (!action) {
				const status = threadData.data.autoReact.enabled ? 
					(threadData.data.autoReact.emoji ? 
						`Enabled with ${threadData.data.autoReact.emoji}` : 
						"Enabled with random emoji") : 
					"Disabled";
				return message.reply(getLang("currentStatus", status));
			}
			
			switch (action) {
				case "on":
					threadData.data.autoReact.enabled = true;
					threadData.data.autoReact.emoji = null;
					await threadsData.set(threadID, threadData);
					return message.reply(getLang("turnedOn"));
					
				case "off":
					threadData.data.autoReact.enabled = false;
					await threadsData.set(threadID, threadData);
					return message.reply(getLang("turnedOff"));
					
				case "set":
					if (!args[1]) {
						return message.reply(getLang("invalidEmoji"));
					}
					const emoji = args[1];
					threadData.data.autoReact.enabled = true;
					threadData.data.autoReact.emoji = emoji;
					await threadsData.set(threadID, threadData);
					return message.reply(getLang("turnedOnWithEmoji", emoji));
					
				case "list":
					return message.reply(getLang("emojiList"));
					
				default:
					return message.reply(getLang("invalidEmoji"));
			}
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	},

	onChat: async function ({ api, event, threadsData }) {
		try {
			// Skip if bot's own message
			if (event.senderID === api.getCurrentUserID()) return;
			
			const threadID = event.threadID;
			const threadData = await threadsData.get(threadID);
			
			if (!threadData.data.autoReact?.enabled) return;
			
			// Random chance to react (50% to seem more human)
			if (Math.random() < 0.5) return;
			
			const reactions = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "💖"];
			const emoji = threadData.data.autoReact.emoji || 
				reactions[Math.floor(Math.random() * reactions.length)];
			
			// Human-like delay before reacting
			setTimeout(() => {
				api.setMessageReaction(emoji, event.messageID, (err) => {
					if (err) console.log("Auto react error:", err);
				});
			}, 1000 + Math.random() * 5000); // 1-6 second delay
			
		} catch (error) {
			console.log("Auto react error:", error);
		}
	}
};